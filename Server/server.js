const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// Configure LowDB
const adapter = new JSONFile('db.json');
// Pass a default data object directly to the Low constructor IF the file is empty/non-existent
// This ensures db.data always has a value, even before the first read.
const db = new Low(adapter, { users: [] }); // <--- THIS IS THE KEY CHANGE

const app = express();
const port = 3000;

app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Middleware for a very basic "authentication" (replace with real auth)
function authenticateUser(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).send('Unauthorized: x-user-id header missing');
    }
    req.userId = userId;
    next();
}

// --- API Endpoints ---

// Register a new user (simplified)
app.post('/api/register', async (req, res) => {
    await db.read(); // Read to ensure we have the latest state from file
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    if (db.data.users.some(u => u.username === username)) {
        return res.status(409).send('User already exists');
    }
    const newUser = { id: username, username, password, scores: [] };
    db.data.users.push(newUser);
    await db.write(); // Write changes back to file
    res.status(201).json({ message: 'User registered', userId: newUser.id });
});

// Login user (simplified)
app.post('/api/login', async (req, res) => {
    await db.read();
    const { username, password } = req.body;
    const user = db.data.users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).send('Invalid credentials');
    }
    res.json({ message: 'Login successful', userId: user.id });
});

// Get scores for the authenticated user
app.get('/api/scores', authenticateUser, async (req, res) => {
    await db.read();
    const user = db.data.users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    res.json(user.scores);
});

// Add a new score for the authenticated user
app.post('/api/scores', authenticateUser, async (req, res) => {
    await db.read();
    const newScore = req.body;
    const user = db.data.users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    user.scores.push(newScore);
    await db.write();
    res.status(201).json({ message: 'Score added', score: newScore });
});

// Clear all scores for the authenticated user
app.delete('/api/scores', authenticateUser, async (req, res) => {
    await db.read();
    const user = db.data.users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    user.scores = [];
    await db.write();
    res.json({ message: 'All scores cleared for user' });
});

// Start the server
app.listen(port, async () => {
    // Initial read and write to ensure db.json is created with default data
    // if it doesn't exist, and to load existing data.
    await db.read();
    await db.write(); // This will create db.json with { "users": [] } if it's new.
    console.log(`Archery server running at http://localhost:${port}`);
});