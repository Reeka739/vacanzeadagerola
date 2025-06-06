// server.js
// Importa i moduli necessari
const express = require('express');
const bodyParser = require('body-parser'); // Per processare i dati JSON in arrivo
const cors = require('cors'); // Per abilitare le richieste Cross-Origin
const nodemailer = require('nodemailer'); // Per inviare email

// Crea un'applicazione Express
const app = express();
// Definisce la porta su cui il server ascolterà.
// Usa la porta definita nell'ambiente (per hosting futuri) o la 3001 di default.
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Abilita CORS per tutte le rotte. Questo permette al frontend (su un'altra porta) di comunicare col backend.
app.use(cors());
// Configura body-parser per interpretare il corpo delle richieste in formato JSON.
app.use(bodyParser.json());
// Configura body-parser per interpretare anche i dati da form URL-encoded (utile se inviassi dati da un form HTML standard).
app.use(bodyParser.urlencoded({ extended: true }));

// --- Configurazione (simulata) per Nodemailer ---
// IMPORTANTE: Per un uso reale, non inserire mai credenziali direttamente nel codice.
// Usa variabili d'ambiente o un sistema di gestione dei segreti.
// Questo transporter usa Ethereal Email, un servizio GRATUITO per testare l'invio di email.
// Le email non vengono realmente consegnate ma puoi vederle tramite un link fornito nella console.
// Vai su https://ethereal.email/create per creare un account di test e sostituisci user e pass.
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email', // Host SMTP di Ethereal
    port: 587, // Porta standard per SMTP con STARTTLS
    secure: false, // true per la porta 465, false per le altre porte
    auth: {
        user: 'maddison53@ethereal.email', // USERNAME generato da Ethereal (o il tuo account Ethereal)
        pass: 'jn7jnAPss4f63QBp6D'  // PASSWORD generata da Ethereal (o la tua password Ethereal)
    }
    // Esempio per GMAIL (SCONSIGLIATO per produzione diretta senza OAuth2 e password per app):
    // service: 'gmail',
    // auth: {
    //   user: 'TUA_EMAIL_GMAIL@gmail.com',
    //   pass: 'TUA_PASSWORD_APPLICAZIONE_GMAIL' // NON la tua password normale!
    // }
});

// --- "Database" temporaneo in memoria (per simulare il salvataggio) ---
// In un'applicazione reale, useresti un vero database (MongoDB, PostgreSQL, MySQL, Firebase Firestore ecc.)
let richiesteSalvate = [];

// --- Definizione delle Rotte (Endpoints API) ---

// Rotta di base per verificare se il server è attivo
app.get('/', (req, res) => {
    res.send('Benvenuto nel backend di Vacanze Agerola! Il server è attivo.');
});

// Rotta per ricevere le richieste di disponibilità dal frontend
app.post('/api/richieste-disponibilita', async (req, res) => {
    console.log('Nuova richiesta di disponibilità ricevuta:', req.body);

    // Estrae i dati dal corpo della richiesta (inviati dal frontend)
    const {
        accommodationName, // Nome della struttura (es. "Hotel Risorgimento")
        accommodationType, // Tipo di struttura (es. "hotel")
        checkInDate,       // Data check-in (formato stringa, es. "05/06/2025")
        checkOutDate,      // Data check-out (formato stringa)
        numPeople,         // Numero di persone (numero)
        numUnits,          // Numero di camere/appartamenti (numero)
        unitType,          // Tipo di unità (es. "Camere" o "Appartamenti")
        contactInfo,       // Email o telefono del cliente (stringa)
        preferences,       // Preferenze opzionali (stringa)
        selectedExtras     // Array di stringhe per i servizi extra selezionati
    } = req.body;

    // Validazione di base (molto semplificata, da migliorare in produzione)
    if (!accommodationName || !checkInDate || !checkOutDate || !numPeople || !contactInfo) {
        console.error("Dati mancanti nella richiesta:", req.body);
        return res.status(400).json({ message: 'Errore: Dati mancanti. Assicurati di compilare tutti i campi obbligatori.' });
    }

    // Crea un oggetto per la nuova richiesta
    const nuovaRichiesta = {
        id: Date.now(), // ID univoco semplice basato sul timestamp
        timestamp: new Date().toISOString(), // Data e ora della richiesta
        accommodationName,
        accommodationType,
        checkInDate,
        checkOutDate,
        numPeople,
        numUnits,
        unitType,
        contactInfo,
        preferences: preferences || 'Nessuna preferenza specificata.',
        selectedExtras: selectedExtras || [],
        status: 'ricevuta' // Stato iniziale della richiesta
    };

    // Salva la richiesta nel nostro "database" in memoria
    richiesteSalvate.push(nuovaRichiesta);
    console.log('Richiesta "salvata" in memoria:', nuovaRichiesta);

    // Prepara l'email di notifica per l'amministratore (Antonio/Irina)
    const emailSubjectPerAdmin = `Nuova Richiesta Disponibilità: ${accommodationName}`;
    let emailBodyPerAdmin = `Ciao Antonio/Irina,\n\nÈ stata ricevuta una nuova richiesta di disponibilità:\n\n`;
    emailBodyPerAdmin += `ID Richiesta: ${nuovaRichiesta.id}\n`;
    emailBodyPerAdmin += `Struttura: ${accommodationName} (Tipo: ${accommodationType})\n`;
    emailBodyPerAdmin += `Periodo: Dal ${checkInDate} al ${checkOutDate}\n`;
    emailBodyPerAdmin += `Numero Persone: ${numPeople}\n`;
    if (numUnits && unitType) {
        emailBodyPerAdmin += `Numero ${unitType}: ${numUnits}\n`;
    }
    emailBodyPerAdmin += `Contatto Cliente: ${contactInfo}\n`;
    emailBodyPerAdmin += `Preferenze/Esigenze: ${nuovaRichiesta.preferences}\n`;
    if (nuovaRichiesta.selectedExtras && nuovaRichiesta.selectedExtras.length > 0) {
        emailBodyPerAdmin += `Servizi Extra Richiesti: ${nuovaRichiesta.selectedExtras.join(', ')}\n`;
    }
    emailBodyPerAdmin += `\nSaluti,\nIl tuo sistema di notifiche Vacanze Agerola`;

    // Opzioni per l'email da inviare
    const mailOptionsPerAdmin = {
        from: '"Sistema Notifiche Vacanze Agerola" <noreply@vacanzeagerola.example.com>', // Mittente (può essere fittizio con Ethereal)
        to: 'antonio.maddaloni95@gmail.com', // **LASCIA QUI LA TUA EMAIL REALE PER LE NOTIFICHE**
        subject: emailSubjectPerAdmin,
        text: emailBodyPerAdmin
    };

    try {
        // Invia l'email
        let info = await transporter.sendMail(mailOptionsPerAdmin);
        console.log('Email di notifica inviata (o simulata con Ethereal).');
        // Per Ethereal, il link per vedere l'email inviata sarà loggato qui:
        console.log('Preview URL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
        
        // Invia una risposta di successo al frontend
        res.status(201).json({ // 201 Created (risorsa creata con successo)
            message: 'Richiesta inviata con successo! Ti contatteremo al più presto per confermare la disponibilità.',
            datiRicevuti: nuovaRichiesta // Opzionale: invia indietro i dati ricevuti per conferma
        });

    } catch (error) {
        console.error("Errore durante l'invio dell'email di notifica:", error);
        // Anche se l'invio dell'email fallisce, la richiesta è stata "salvata" in memoria.
        // Potresti voler comunque rispondere con successo al cliente o informarlo di un problema interno.
        // Per questa bozza, informiamo che c'è stato un problema con la notifica ma la richiesta è stata presa.
        res.status(500).json({ // 500 Internal Server Error
             message: 'La tua richiesta è stata ricevuta, ma si è verificato un problema tecnico con la notifica. Sarai comunque contattato al più presto.',
             dettagliErrore: 'Errore invio email di notifica interna.',
             datiRicevuti: nuovaRichiesta
        });
    }
});

// Rotta opzionale per vedere tutte le richieste "salvate" in memoria (solo per debug)
// ATTENZIONE: In un'applicazione di produzione, questa rotta dovrebbe essere protetta o rimossa.
app.get('/api/visualizza-richieste', (req, res) => {
    if (process.env.NODE_ENV !== 'production') { // Mostra solo se non siamo in ambiente di produzione
        res.json(richiesteSalvate);
    } else {
        res.status(403).send('Accesso non consentito.');
    }
});


// --- Avvio del Server ---
// Il server si mette in ascolto sulla porta specificata.
app.listen(PORT, () => {
    console.log(`Backend server per Vacanze Agerola in ascolto sulla porta ${PORT}`);
    console.log(`Puoi accedere al server (per la rotta base) su http://localhost:${PORT}`);
    console.log(`---`);
    console.log(`Per testare l'invio email con Ethereal:`);
    console.log(`1. Assicurati che le credenziali (user/pass) in 'transporter' siano quelle del tuo account Ethereal.`);
    console.log(`2. Se non hai un account Ethereal, creane uno su: https://ethereal.email/create`);
    console.log(`3. Quando una richiesta viene inviata, controlla questa console per il 'Preview URL'.`);
    console.log(`---`);
});
