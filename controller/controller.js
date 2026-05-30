const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, '..', 'telephone_catalog.csv');
const CSV_HEADER = 'telephonenumber,name,surname,notes';


function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function escapeCsvField(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function contactToCsvRow(contact) {
    return [
        escapeCsvField(contact.telephonenumber),
        escapeCsvField(contact.name),
        escapeCsvField(contact.surname),
        escapeCsvField(contact.notes)
    ].join(',');
}

async function readCsv() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(CSV_PATH)) {
            fs.writeFileSync(CSV_PATH, CSV_HEADER + '\r\n', 'utf8');
            return resolve([]);
        }

        const contacts = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(CSV_PATH, 'utf8'),
            crlfDelay: Infinity
        });

        let firstLine = true;
        rl.on('line', (line) => {
            if (firstLine) { firstLine = false; return; } // skip header
            if (!line.trim()) return;
            const [telephonenumber, name, surname, ...notesParts] = parseCsvLine(line);
            contacts.push({
                telephonenumber: telephonenumber || '',
                name: name || '',
                surname: surname || '',
                notes: notesParts.join(',') || ''
            });
        });

        rl.on('close', () => resolve(contacts));
        rl.on('error', reject);
    });
}

async function writeCsv(contacts) {
    const rows = [CSV_HEADER, ...contacts.map(contactToCsvRow)];
    fs.writeFileSync(CSV_PATH, rows.join('\r\n') + '\r\n', 'utf8');
}

async function getAllContacts() {
    return await readCsv();
}

async function addContact(contact) {
    const contacts = await readCsv();
    const exists = contacts.some(c => c.telephonenumber === contact.telephonenumber);
    if (exists) throw new Error(`Contact with number ${contact.telephonenumber} already exists.`);
    contacts.push(contact);
    await writeCsv(contacts);
}

async function editContact(originalNumber, updatedContact) {
    const contacts = await readCsv();
    const idx = contacts.findIndex(c => c.telephonenumber === originalNumber);
    if (idx === -1) throw new Error(`Contact with number ${originalNumber} not found.`);
    contacts[idx] = { ...contacts[idx], ...updatedContact };
    await writeCsv(contacts);
}

async function deleteContact(telephonenumber) {
    const contacts = await readCsv();
    const filtered = contacts.filter(c => c.telephonenumber !== telephonenumber);
    if (filtered.length === contacts.length) throw new Error(`Contact with number ${telephonenumber} not found.`);
    await writeCsv(filtered);
}

async function searchContacts(query) {
    const contacts = await readCsv();
    const q = query.toLowerCase();
    return contacts.filter(c =>
        c.telephonenumber.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.surname.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
    );
}

async function sortContacts(field, direction = 'asc') {
    const contacts = await readCsv();
    const validFields = ['telephonenumber', 'name', 'surname', 'notes'];
    if (!validFields.includes(field)) throw new Error(`Invalid sort field: ${field}`);

    contacts.sort((a, b) => {
        const aVal = a[field].toLowerCase();
        const bVal = b[field].toLowerCase();
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return contacts;
}

module.exports = {
    getAllContacts,
    addContact,
    editContact,
    deleteContact,
    searchContacts,
    sortContacts
};
