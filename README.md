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

## Account Jochem

`index.html?profiel=jochem` opent het upper-profiel met gebruikersnaam `jochem`. Elke Upper begint met twee sets Bench Press. Lower ontbreekt in trainingen, cyclus en statistieken; Overig bevat geen deadlift. Jochem kiest via zijn eenmalige activatielink zelf een wachtwoord (minimaal 12 tekens). De naam boven de trainingstitel is verwijderd.

Firebase Authentication gebruikt intern een gereserveerd loginadres; er wordt geen e-mail verstuurd. Het account heeft een vaste UID en een aparte Firebase-app/authsessie. Firestore laat uitsluitend de eigenaar en Jochem hun eigen `schemaTjapo`-documenten lezen en schrijven. De profielnaam in de URL geeft op zichzelf geen toegang. Zonder persoonlijk e-mailadres verloopt accountherstel via de beheerder.

Voortgang wordt onder de UID lokaal bewaard en naar Firestore gesynchroniseerd. Na inloggen wordt online voortgang opgehaald; nog niet gesynchroniseerde lokale wijzigingen blijven bewaard en worden bij herstel van de verbinding opnieuw geprobeerd. Bestaande lokale Jochem-invoer wordt bij de eerste login gekopieerd (de oude kopie blijft staan). De gewone URL behoudt de oorspronkelijke opslag en het schema van Tijs.

Cloudschrijfacties gebruiken een transactie en revisienummer. Als een ander apparaat dezelfde voortgang heeft gewijzigd, wordt geen versie stilzwijgend overschreven. De gebruiker kiest de versie; de vervangen versie blijft als downloadbare lokale herstelkopie beschikbaar. Stats > Export/Import blijft beschikbaar voor eigen backups.

Activatiesleutels en wachtwoorden horen nooit in deze repository. Een activatielink bevat het tijdelijke wachtwoord alleen in het URL-fragment. De app verwijdert dit uit de adresbalk en vervangt het tijdelijke wachtwoord bij activatie door het zelfgekozen wachtwoord. Een gebruikte link werkt daarna niet meer.

Lichaamsgewicht bij dips en pull-ups volgt de laatste eigen dagmeting op of vóór de trainingsdatum. Opgeslagen oude gewichten worden daarmee gecorrigeerd; latere metingen veranderen eerdere trainingsdagen niet. Een komma blijft tijdens het invoeren van decimalen staan; opslag en berekeningen gebruiken een punt.

Geluiden staan standaard uit voor beide accounts. De instelling onderaan Stats wordt per account opgeslagen. Uitgeschakeld geluid laadt of activeert geen audio en sluit een al geopende audioverbinding.

Verificatie: `node --test tests/*.test.mjs tests/history.test.cjs`.

De app controleert bij openen, terugkomst en tijdens gebruik op een nieuwe versie. Een beschikbare update verschijnt bovenaan; onderaan Stats staat altijd App bijwerken met het profiel en de huidige versie. Bijwerken bewaart eerst de lokale voortgang en de markering voor cloudsynchronisatie, en herlaadt daarna dezelfde profiellink. Er wordt niet automatisch herladen tijdens een training en er wordt geen account- of trainingsopslag gewist. Een al geopende versie van vóór deze update heeft eenmalig een volledige herstart of herlaadactie nodig.
