const express = require('express');
const path = require('path');
const controller = require('./controller/controller');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (CSS)
app.use('/css', express.static(path.join(__dirname, 'hemsida', 'styling')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'hemsida'));

// Routes
app.get('/', async (req, res) => {
    try {
        const contacts = await controller.getAllContacts();
        res.render('hemsida', { contacts });
    } catch (err) {
        res.status(500).send('Error loading contacts: ' + err.message);
    }
});

app.post('/add', async (req, res) => {
    try {
        const { telephonenumber, name, surname, notes } = req.body;
        await controller.addContact({ telephonenumber, name, surname, notes });
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error adding contact: ' + err.message);
    }
});

app.post('/edit', async (req, res) => {
    try {
        const { originalNumber, telephonenumber, name, surname, notes } = req.body;
        await controller.editContact(originalNumber, { telephonenumber, name, surname, notes });
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error editing contact: ' + err.message);
    }
});

app.post('/delete', async (req, res) => {
    try {
        const { telephonenumber } = req.body;
        await controller.deleteContact(telephonenumber);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error deleting contact: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Telephone Catalog running at http://localhost:${PORT}`);
});
