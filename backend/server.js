// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const config = {
    user: 'shah', // Update with your database username
    password: 'Root@10.0.19.97', // Update with your database password
    server: 'notake.database.windows.net', // Update with your database server
    database: 'Notes', // Update with your database name
    options: {
        encrypt: true, // Use encryption
        enableArithAbort: true
    }
};

app.use(bodyParser.json());
app.use(cors());

sql.connect(config, err => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to database');
});

let notes = [];

// Fetch notes from database
const fetchNotes = async () => {
    try {
        const result = await sql.query`SELECT * FROM Notes`;
        notes = result.recordset;
    } catch (err) {
        console.error('Error fetching notes: ', err);
    }
};

// Initialize notes
fetchNotes();

app.get('/api/notes', (req, res) => {
    res.json(notes);
});

app.post('/api/notes', async (req, res) => {
    const { content } = req.body;
    try {
        await sql.query`INSERT INTO Notes (content) VALUES (${content})`;
        await fetchNotes();
        io.emit('noteUpdate', notes);
        res.json(notes);
    } catch (err) {
        console.error('Error adding note: ', err);
        res.status(500).send('Error adding note');
    }
});

io.on('connection', socket => {
    console.log('New client connected');
    socket.emit('noteUpdate', notes);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server running on port ${port}`));
