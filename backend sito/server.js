// server.js - Versione 2.2
// Importa i moduli necessari
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path'); // Modulo 'path' per gestire i percorsi dei file

// Crea un'applicazione Express
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// --- Percorso alla cartella del Frontend ---
// Costruiamo il percorso assoluto alla cartella del frontend.
// '..' significa "vai su di una cartella" (da 'backend sito' a 'vacanzeadagerola')
const frontendDirectoryPath = path.join(__dirname, '..', 'Frontend sito');

// Log di debug per verificare il percorso
console.log(`Percorso della cartella frontend servita: ${frontendDirectoryPath}`);


// --- Servire i file statici del frontend ---
// Dice a Express di servire automaticamente i file (CSS, immagini, ecc.)
// trovati in quella cartella.
app.use(express.static(frontendDirectoryPath));


// --- API Route per le richieste ---
// Questa rotta gestisce l'invio del modulo.
// Deve venire PRIMA della rotta "catch-all".
app.post('/api/richieste-disponibilita', async (req, res) => {
    console.log('Nuova richiesta di disponibilità ricevuta:', req.body);

    const {
        accommodationName,
        accommodationType,
        checkInDate,
        checkOutDate,
        numPeople,
        numUnits,
        unitType,
        contactInfo,
        preferences,
        selectedExtras
    } = req.body;

    if (!accommodationName || !checkInDate || !checkOutDate || !numPeople || !contactInfo) {
        console.error("Dati mancanti nella richiesta:", req.body);
        return res.status(400).json({ message: 'Errore: Dati mancanti. Assicurati di compilare tutti i campi obbligatori.' });
    }

    const nuovaRichiesta = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
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
        status: 'ricevuta'
    };

    // Logica per salvare in memoria e inviare email
    let richiesteSalvate = []; // Simula database
    richiesteSalvate.push(nuovaRichiesta);
    console.log('Richiesta "salvata" in memoria:', nuovaRichiesta);

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: 'maddison53@ethereal.email', pass: 'jn7jnAPss4f63QBp6D' }
    });
    
    const emailSubjectPerAdmin = `Nuova Richiesta Disponibilità: ${accommodationName}`;
    let emailBodyPerAdmin = `Ciao Antonio/Irina,\n\nÈ stata ricevuta una nuova richiesta di disponibilità:\n\nID Richiesta: ${nuovaRichiesta.id}\nStruttura: ${accommodationName}\nPeriodo: Dal ${checkInDate} al ${checkOutDate}\nPersone: ${numPeople}\nContatto: ${contactInfo}`;

    const mailOptionsPerAdmin = {
        from: '"Notifiche Sito" <noreply@example.com>',
        to: 'antonio.maddaloni95@gmail.com',
        subject: emailSubjectPerAdmin,
        text: emailBodyPerAdmin
    };

    try {
        let info = await transporter.sendMail(mailOptionsPerAdmin);
        console.log('Preview URL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
        res.status(201).json({ message: 'Richiesta inviata con successo! Ti contatteremo al più presto.' });
    } catch (error) {
        console.error("Errore invio email:", error);
        res.status(500).json({ message: 'Errore interno del server durante l\'invio della notifica.' });
    }
});


// --- Rotta "Catch-All" per servire la pagina HTML ---
// Questa rotta deve essere l'ULTIMA.
// Se una richiesta non corrisponde a un file statico o a una rotta API,
// invia il file HTML principale. Questo è utile per le Single Page Application.
app.get('*', (req, res) => {
    const mainHtmlFile = 'vacanzeadagerola.html'; // Assicurati che il nome sia corretto
    res.sendFile(path.join(frontendDirectoryPath, mainHtmlFile), (err) => {
        if (err) {
            console.error('Errore nell\'invio del file HTML principale:', err);
            res.status(404).send("Pagina non trovata. Controlla che il nome del file '"+mainHtmlFile+"' sia corretto e presente nella cartella del frontend.");
        }
    });
});


// --- Avvio del Server ---
app.listen(PORT, () => {
    console.log(`Backend server in ascolto sulla porta ${PORT}`);
    console.log(`Apri il sito accedendo alla porta ${PORT} dal pannello "Porte" del Codespace.`);
    console.log(`---`);
});
