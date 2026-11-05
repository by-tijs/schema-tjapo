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

## Vorige uitvoering

Train gebruikt de laatste geregistreerde uitvoering van dezelfde oefening en setup, ook uit een andere schema-sessie. Eén complete set is voldoende: extra setrijen blijven leeg en worden niet aangevuld vanuit oudere trainingen. Historie bekijken en kopiëren behouden dezelfde setposities. Verschillende setups en meetvormen worden apart gehouden.

## Tests

Voer de regressietests uit met `node --test tests/history.test.cjs`. De tests gebruiken synthetische data en maken geen verbinding met Firebase.

## Accounts Jochem en Joep

De vaste installatiepagina voor Jochem is `jochem.html`. Deze levert vanaf het eerste HTML-document Jochems titel en manifest; de iPhone-installatie hangt daardoor niet af van een latere JavaScript-wijziging van het manifest. Oude links met `profiel=jochem` worden hierheen doorgestuurd. Het bestaande manifest-id, Firebase-account en de lokale opslagsleutels blijven gelijk. De serviceworker bewaart voor beide profielen de juiste offline startpagina apart.

Na een wijziging in `index.html`: voer `node scripts/generate-jochem-page.mjs` uit en commit ook `jochem.html` en `joep.html`. De tests controleren dat de pagina's gelijk blijven behalve de installatiegegevens.

`index.html?profiel=jochem` opent het profiel met gebruikersnaam `jochem`. Elke Upper begint met twee sets Bench Press en bevat geen Smith traps. Lower A bevat Squat, Seated leg curl en Leg extension. Lower B bevat Deadlift, Leg extension, Seated leg curl, Cable hip abduction en Cable hip adduction. Deze oefeningen hebben elk twee sets; de kabeloefeningen worden per kant gelogd. Jochem heeft geen Overig of Rehab. Jochem kiest via zijn eenmalige activatielink zelf een wachtwoord (minimaal 12 tekens). De naam boven de trainingstitel is verwijderd.

Firebase Authentication gebruikt intern een gereserveerd loginadres; er wordt geen e-mail verstuurd. Het account heeft een vaste UID en een aparte Firebase-app/authsessie. Firestore laat uitsluitend Tijs, Jochem en Joep hun eigen `schemaTjapo`-documenten lezen en schrijven. De profielnaam in de URL geeft op zichzelf geen toegang. Zonder persoonlijk e-mailadres verloopt accountherstel via de beheerder.

Voortgang wordt onder de UID lokaal bewaard en naar Firestore gesynchroniseerd. Na herstel van de Firebase-sessie opent een terugkerende gebruiker direct de eigen lokale voortgang; Firestore wordt op de achtergrond geladen en gesynchroniseerd. Het inlogformulier verschijnt alleen wanneer de sessiecontrole klaar is en opnieuw inloggen nodig is. Een nieuw apparaat wacht op de eerste cloudgegevens voordat invoer mogelijk is; nog niet gesynchroniseerde lokale wijzigingen blijven bewaard en worden bij herstel van de verbinding opnieuw geprobeerd. Bestaande lokale Jochem-invoer wordt bij de eerste login gekopieerd (de oude kopie blijft staan). De gewone URL behoudt de oorspronkelijke opslag en het schema van Tijs.

Cloudschrijfacties gebruiken een transactie en revisienummer. Als een ander apparaat dezelfde voortgang heeft gewijzigd, wordt geen versie stilzwijgend overschreven. De gebruiker kiest de versie; de vervangen versie blijft als downloadbare lokale herstelkopie beschikbaar. Stats > Export/Import blijft beschikbaar voor eigen backups.

Activatiesleutels en wachtwoorden horen nooit in deze repository. Een activatielink bevat het tijdelijke wachtwoord alleen in het URL-fragment. De app verwijdert dit uit de adresbalk en vervangt het tijdelijke wachtwoord bij activatie door het zelfgekozen wachtwoord. Een gebruikte link werkt daarna niet meer.

Lichaamsgewicht bij dips en pull-ups volgt de laatste eigen dagmeting op of vóór de trainingsdatum. Opgeslagen oude gewichten worden daarmee gecorrigeerd; latere metingen veranderen eerdere trainingsdagen niet. Een komma blijft tijdens het invoeren van decimalen staan; opslag en berekeningen gebruiken een punt.

Geluiden staan standaard uit voor alle accounts. De instelling onderaan Stats wordt per account opgeslagen. Uitgeschakeld geluid laadt of activeert geen audio en sluit een al geopende audioverbinding.

Verificatie: `node --test tests/*.test.mjs tests/history.test.cjs`.

De app controleert bij openen, terugkomst en tijdens gebruik op een nieuwe versie. Een beschikbare update verschijnt bovenaan; onderaan Stats staat altijd App bijwerken met het profiel en de huidige versie. Bijwerken bewaart eerst de lokale voortgang en de markering voor cloudsynchronisatie, en herlaadt daarna dezelfde profiellink. Er wordt niet automatisch herladen tijdens een training en er wordt geen account- of trainingsopslag gewist. Een al geopende versie van vóór deze update heeft eenmalig een volledige herstart of herlaadactie nodig.

Tijs heeft in Upper A twee sets Flat smith in plaats van Single cable press. De oude oefening blijft beschikbaar in Stats, met behoud van historische sets, grafieken en records. Historische oefeningen worden vanuit de opgeslagen training gelezen, onafhankelijk van het huidige schema.

Stats toont datum en meetwaarde bij aanwijzen, aanraken of horizontaal schuiven over de grafiek. De pijltjestoetsen en Home/End werken ook. Verticaal scrollen blijft beschikbaar.

## Eigen schema

Alle accounts hebben **Bewerken** in de vaste navigatie, naast Train, Log, Gewicht en Stats. Alleen Tijs heeft daarnaast Rehab en de dag Overig. Via `#schema` kan ieder account trainingsdagen toevoegen, hernoemen, kopiëren, verplaatsen en verwijderen, en oefeningen met vaste setaantallen beheren. De dagacties staan samen op één rij. Een plus voegt direct een lege oefeningkaart toe; naam en sets worden daarna ingevuld. Nieuwe dagen en oefeningen tonen `Naam invullen` als placeholder. Overig blijft beschikbaar voor losse activiteiten; de snelkeuzes zijn bewerkbaar. Dag- en oefeningnamen zijn vrije tekstvelden zonder suggestielijst. Setup, rusttijd, links/rechts, lichaamsgewicht en tijdmetingen staan bij Meer opties. Tijdens bewerken vervangt een vaste balk met Annuleren en Opslaan de normale navigatie; alleen Opslaan past het schema toe.

Dagbenamingen zijn vrij, bijvoorbeeld Push, Pull, Legs en Upper/Lower. De dag bepaalt niet langer de indeling in Stats: iedere krachtoefening heeft een eigen spiergroep. Upper bevat borst, rug, schouders, biceps en triceps; Lower bevat quads & glutes, hamstrings en kuiten; Accessories bevat nek, traps, onderarmen/grip en buik. Bekende namen worden automatisch ingedeeld, bij onbekende nieuwe oefeningen kiest de gebruiker een spiergroep. De oude groepskeuze per dag is uit de editor gehaald. Running en Gewicht blijven aparte metingen.

Een gekozen `muscleGroup` wordt meegenomen in het persoonlijke schema, de oefeningsuggesties, nieuwe trainingsinvoer en historische snapshots. Metrics, indexen en records selecteren oefeningen op hun spiergroep, ook als verschillende groepen op dezelfde dag worden getraind. Oude gegevens zonder expliciete keuze worden op naam ingedeeld; alleen onbekende historische namen gebruiken de vroegere daggroep als terugval. Zo verhuizen nek, traps en polsen ook voor bestaande metingen naar Accessories zonder gelogde sets of gewichten te herschrijven. Een andere expliciete keuze in het huidige schema herschrijft de categorie van vastgelegde trainingen niet.

`plan-model.js` beheert `state.personalPlan`; `plan-editor.js` en `plan-editor.css` gebruiken de bestaande kaarten, knoppen en dagenrij. Zonder opgeslagen persoonlijk schema blijft het bestaande schema actief. Het schema wordt via dezelfde lokale opslag, cloudsync en backup meegenomen. De editor weigert een verouderde schemaversie te overschrijven. Joep begint zonder dagen of oefeningen. Een lege Train toont alleen + Dag toevoegen; vanuit de editor kunnen ook de laatste dag en alle oefeningen worden verwijderd. Jochem begint met zijn bestaande Upper A–D en Lower A–B.

Bij opslaan krijgen ingevulde trainingen en historische sessies een eigen `sessionSnapshot`; lege concepttrainingen worden opnieuw opgebouwd uit het aangepaste schema. Verwijderde dagen worden intern bewaard voor historische verwijzingen. Log, vorige sets, voltooiing, records en grafieken lezen de vastgelegde training. Naamscorrecties behouden de koppeling met eerdere metingen via `nameAliases`. Nieuwe trainingsdagen behouden hun vaste ID bij hernoemen of verplaatsen.


Joep installeert via `joep.html` en logt in met gebruikersnaam `joep`. Hij kiest bij activatie zelf zijn wachtwoord, net zoals Jochem. Zijn account begint zonder ingevoerd trainingsschema. Wanneer Joep opslaat, deelt de app alleen zijn huidige dagen en oefeningdefinities in `sharedPlans/{joepUid}`. Tijs kan dit onder **Stats > Schema Joep** lezen en vernieuwen. Trainingslogs, gewichten en gearchiveerde dagen worden niet via deze weergave gedeeld. Firestore schrijft eigen voortgang en dit gedeelde schema in dezelfde transactie; alleen Joep mag het gedeelde document schrijven en alleen Joep en Tijs mogen het lezen.

## Opstarten

De serviceworker opent de juiste lokaal opgeslagen profielpagina direct en ververst die op de achtergrond. De huidige pagina wordt daarbij niet vervangen; updates blijven via de bestaande updateknop lopen. Een expliciet aangevraagde nieuwere versie haalt wel eerst nieuwe HTML op. Persoonlijke gegevens blijven achter de bestaande Firebase-sessiecontrole. Na een bevestigde sessie kan de eigen cache direct openen, terwijl de Firestore-module en de cloudgegevens daarna laden. Een nieuw apparaat blijft wachten op een geslaagde eerste download, ook na herladen tijdens een storing.

De bestaande lettertypecontrole en wisselanimaties blijven behouden. De app laadt dezelfde Lucide-SVG's uit een bundel met alleen de gebruikte iconen. Opnieuw bouwen na het toevoegen van een icoon: `npm install --prefix /tmp/schema-icons-build --ignore-scripts lucide@1.69.0 esbuild@0.25.12`, daarna `node scripts/build-icons.mjs /tmp/schema-icons-build`. De test vergelijkt de SVG's met de oorspronkelijke bibliotheek.
