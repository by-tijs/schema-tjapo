# Schema Tjapo

Dark minimal training tracker met lokale opslag, backup export/import en optionele Firebase cloud sync.

## Firebase setup

1. Maak een gratis Firebase project.
2. Voeg een Web app toe.
3. Zet Authentication > Sign-in method > Email/Password aan.
4. Maak Cloud Firestore aan.
5. Plak de inhoud van `firebase.rules` in Firestore Rules en publiceer.
6. Plak je Firebase web config in `firebase-config.js`.

De Firebase config is geen wachtwoord. De Firestore rules bepalen wie data mag lezen/schrijven.

## Data

De app bewaart lokaal in de browser en syncet naar Firestore zodra Firebase is ingesteld en je bent ingelogd. Gebruik daarnaast `Stats > Backup > Export` als extra noodbackup naar iCloud Drive.
