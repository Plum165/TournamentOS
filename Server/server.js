const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node'); // Use /node for ES modules compatibility

// Configure LowDB
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Default data structure if db.json is empty
db.data = db.data || { users: [] };

const app = express();
const port = 3000;

app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Middleware for a very basic "authentication" (replace with real auth)
function authenticateUser(req, res, next) {
    // For simplicity, we'll assume a 'userId' header is sent
    // In a real app, this would verify a JWT or session token
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
    await db.read();
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    if (db.data.users.some(u => u.username === username)) {
        return res.status(409).send('User already exists');
    }
    const newUser = { id: username, username, password, scores: [] }; // Using username as ID for simplicity
    db.data.users.push(newUser);
    await db.write();
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
    res.json({ message: 'Login successful', userId: user.id }); // Return userId to be used in headers
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
    user.scores = []; // Clear all scores
    await db.write();
    res.json({ message: 'All scores cleared for user' });
});


// Start the server
app.listen(port, async () => {
    await db.read(); // Read database when server starts
    console.log(`Archery server running at http://localhost:${port}`);
});