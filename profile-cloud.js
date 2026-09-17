"use strict";

// The account's UID is fixed by the app; a URL/profile name never grants access.
class ProfileAccount {
  constructor(options) {
    Object.assign(this, options);
    this.authenticated = false;
    this.ready = false;
    this.busy = false;
    this.epoch = 0;
    this.localVersion = 0;
    this.meta = this.readJson(`${this.key}:sync`) || { revision: 0, pending: false };
    this.status = "Account laden…";
    this.conflict = null;
    this.inFlight = null;
  }
  readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }
  saveMeta() { localStorage.setItem(`${this.key}:sync`, JSON.stringify(this.meta)); }
  notify(status) { if (status) this.status = status; this.onStatus(this); }
  async init(config, version) {
    try {
      const [app, auth, db] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`),
      ]);
      this.authApi = auth;
      this.dbApi = db;
      const name = `schema-tjapo-${this.profile.id}`;
      this.app = app.getApps().find((item) => item.name === name) || app.initializeApp(config, name);
      this.auth = auth.getAuth(this.app);
      this.db = db.getFirestore(this.app);
      await auth.setPersistence(this.auth, auth.browserLocalPersistence);
      auth.onAuthStateChanged(this.auth, (user) => {
        if (!this.activating) this.onSession(user);
      });
      window.addEventListener("online", () => this.sync());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this.sync();
      });
      this.retryTimer = setInterval(() => {
        if (this.authenticated && this.meta.pending && !this.conflict) this.sync();
      }, 30000);
    } catch {
      this.notify("Account kon niet laden. Controleer je verbinding en herlaad de pagina.");
    }
  }
  async onSession(user) {
    if (user?.uid === this.profile.uid && this.authenticated) return;
    const epoch = ++this.epoch;
    clearTimeout(this.timer);
    this.conflict = null;
    this.ready = false;
    this.authenticated = false;
    if (user && user.uid !== this.profile.uid) {
      await this.authApi.signOut(this.auth);
      this.notify("Dit account hoort niet bij dit profiel.");
      return;
    }
    if (!user) {
      this.onLoad({});
      this.notify(this.invitation ? "Kies een wachtwoord voor je account." : "Log in om je schema en voortgang te openen.");
      return;
    }
    this.authenticated = true;
    this.meta = this.readJson(`${this.key}:sync`) || { revision: 0, pending: false };
    const cached = this.readJson(this.key);
    const legacy = !cached && this.readJson(this.legacyKey);
    const initial = cached || legacy || {};
    if (legacy && this.hasData(legacy)) {
      this.meta.pending = true;
      this.saveMeta();
    }
    this.ref = this.dbApi.doc(this.db, "users", user.uid, "schemaTjapo", "state");
    this.onLoad(initial);
    this.notify("Voortgang ophalen…");
    // A previous session may still be finishing a request; its epoch prevents it applying data.
    if (this.inFlight) await this.inFlight;
    if (epoch !== this.epoch) return;
    await this.sync();
    if (epoch !== this.epoch) return;
    this.ready = true;
    this.notify();
  }
  async submit(username, password, confirmation) {
    if (this.busy || !this.auth) return;
    if (username.trim().toLowerCase() !== this.profile.id) {
      this.notify("Gebruik gebruikersnaam jochem."); return;
    }
    if (this.invitation && (password.length < 12 || password !== confirmation)) {
      this.notify(password.length < 12 ? "Kies een wachtwoord van minimaal 12 tekens." : "De wachtwoorden komen niet overeen.");
      return;
    }
    this.busy = true;
    this.notify(this.invitation ? "Account activeren…" : "Inloggen…");
    try {
      if (this.invitation) {
        this.activating = true;
        const result = await this.authApi.signInWithEmailAndPassword(this.auth, this.profile.email, this.invitation);
        if (result.user.uid !== this.profile.uid) throw new Error("wrong-account");
        await this.authApi.updatePassword(result.user, password);
        this.invitation = "";
        sessionStorage.removeItem("schema-tjapo:jochem:activation");
        this.activating = false;
        await this.onSession(result.user);
      } else {
        await this.authApi.signInWithEmailAndPassword(this.auth, this.profile.email, password);
      }
      this.clearPasswords();
    } catch (error) {
      if (this.activating) {
        await this.authApi.signOut(this.auth).catch(() => {});
        this.activating = false;
      }
      this.notify(error.code === "auth/network-request-failed"
        ? "Geen verbinding. Je kunt het opnieuw proberen."
        : this.invitation
          ? "Activeren mislukt. De link is mogelijk al gebruikt. Open de gewone link om in te loggen."
          : "Inloggen mislukt. Controleer je gebruikersnaam en wachtwoord.");
    } finally { this.busy = false; this.notify(); }
  }
  markEdited() {
    if (this.authenticated) this.localVersion += 1;
  }
  queueSave() {
    if (!this.authenticated) return;
    this.localVersion += 1;
    this.meta.pending = true;
    this.meta.mutationId = crypto.randomUUID();
    this.saveMeta();
    this.notify("Op dit apparaat opgeslagen · nog niet online");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.sync(), 1000);
  }
  sync() {
    if (!this.authenticated || !this.ref || this.conflict) return Promise.resolve(false);
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.performSync().finally(() => { this.inFlight = null; });
    return this.inFlight;
  }
  async performSync() {
    const epoch = this.epoch;
    const ref = this.ref;
    const version = this.localVersion;
    const pending = this.meta.pending;
    const baseRevision = this.meta.revision || 0;
    const snapshot = structuredClone(this.getState());
    this.notify("Synchroniseren…");
    try {
      let remote;
      let uploaded = false;
      let migratedRemote = false;
      if (pending) {
        const mutationId = this.meta.mutationId || crypto.randomUUID();
        this.meta.mutationId = mutationId;
        this.saveMeta();
        remote = await this.dbApi.runTransaction(this.db, async (transaction) => {
          const doc = await transaction.get(ref);
          const previous = doc.exists() ? doc.data() : null;
          if (epoch !== this.epoch) throw new Error("session-changed");
          // A commit may succeed even when its response is lost. Retrying it is idempotent.
          if (previous?.mutationId === mutationId) return previous;
          if ((previous?.revision || 0) !== baseRevision && this.hasData(previous?.state || {})) return { conflict: previous };
          const payload = { app: "Schema Tjapo", version: 1, revision: (previous?.revision || 0) + 1, mutationId,
            updatedAt: snapshot.updatedAt || new Date().toISOString(), savedAt: new Date().toISOString(), state: snapshot };
          transaction.set(ref, payload);
          return payload;
        });
        uploaded = !remote?.conflict;
      } else {
        const doc = await this.dbApi.getDocFromServer(ref);
        remote = doc.exists() ? doc.data() : null;
      }
      if (epoch !== this.epoch) return false;
      if (remote?.conflict || (!pending && this.localVersion !== version && remote && (remote.revision || 0) !== baseRevision)) {
        this.conflict = remote.conflict || remote;
        this.notify("Er is ook op een ander apparaat voortgang gewijzigd. Kies welke versie je wilt bewaren.");
        return false;
      }
      if (!pending && !remote) this.meta.pending = true;
      if (remote?.state) {
        if (!uploaded && this.localVersion === version
          && (!this.meta.hasRemote || (remote.revision || 0) !== baseRevision)) migratedRemote = Boolean(this.onLoad(remote.state));
        this.meta.hasRemote = true;
        this.meta.revision = remote.revision || 0;
        this.meta.savedAt = remote.savedAt;
      }
      if (uploaded && this.localVersion === version) {
        this.meta.pending = false;
        delete this.meta.mutationId;
      }
      this.saveMeta();
      // Persist app migrations only after adopting the server revision they were based on.
      if (migratedRemote) this.queueSave();
      this.notify(this.meta.pending ? "Op dit apparaat opgeslagen · nog niet online" : "Alle voortgang staat online opgeslagen.");
      if (this.meta.pending) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.sync(), 0);
      }
      return true;
    } catch {
      if (epoch === this.epoch) this.notify("Cloud tijdelijk niet bereikbaar. Je invoer blijft op dit apparaat en wordt opnieuw geprobeerd.");
      return false;
    }
  }
  async resolveConflict(useLocal) {
    if (!this.conflict) return;
    const remote = this.conflict;
    localStorage.setItem(`${this.key}:recovery`, JSON.stringify({
      app: "Schema Tjapo", version: 1, exportedAt: new Date().toISOString(),
      state: useLocal ? remote.state : this.getState(),
    }));
    this.meta.revision = remote.revision || 0;
    this.meta.pending = useLocal;
    delete this.meta.mutationId;
    this.conflict = null;
    if (!useLocal) this.onLoad(remote.state);
    this.saveMeta();
    await this.sync();
  }
  async logout() {
    clearTimeout(this.timer);
    await this.sync();
    // Invalidate callbacks before a later login can load another session.
    ++this.epoch;
    await this.authApi.signOut(this.auth);
  }
}
window.ProfileAccount = ProfileAccount;
