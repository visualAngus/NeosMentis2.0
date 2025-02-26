const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { executeQuery } = require('./config/db');
const authRoutes = require('./routes/auth');
const collaborateurRoutes = require('./routes/collaborateur');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/document');
const http = require('http');
const WebSocket = require('ws');
const { setupWebSocket } = require('./config/wss'); // Import du module WebSocket
var RateLimit = require('express-rate-limit');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// limiteur de requête
app.use(express.json({ limit: '10kb' }));

// set up rate limiter: maximum of 100 requests per 15 minutes
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max 200 requests per windowMs
});
app.use(limiter);


// Création du serveur HTTP
const server = http.createServer(app);


setupWebSocket(server); // Initialisation du serveur WebSocket

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Connexion à la base de données (MySQL)
connectDB();
// Middleware
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile('./public/html/home.html', { root: __dirname })
}
);
app.get('/login', (req, res) => {
    res.sendFile('./public/html/login.html', { root: __dirname })
}
);
app.get('/document', (req, res) => {
    res.sendFile('./public/html/doc.html', { root: __dirname })
}
);
app.get('/documents', (req, res) => {
    res.sendFile('./public/html/docs.html', { root: __dirname })
}
);

// Routes
app.use('/auth', (req, res, next) => {
    next();
}, authRoutes);

app.use('/user', (req, res, next) => {
    next();
}, userRoutes);

app.use('/collaborateur', (req, res, next) => {
    next();
}, collaborateurRoutes);

app.use('/document', (req, res, next) => {
    next();
}, documentRoutes);

server.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));