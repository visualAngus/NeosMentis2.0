const express = require('express');
const dotenv = require('dotenv');

// Charger les variables d'environnement en premier
dotenv.config();

// Ensuite importer les modules
const { connectDB } = require('./config/db');
const { executeQuery } = require('./config/db');
const authRoutes = require('./routes/auth');
const collaborateurRoutes = require('./routes/collaborateur');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/document');
const http = require('http');
const WebSocket = require('ws');
const { setupWebSocket } = require('./config/wss'); 
const RateLimit = require('express-rate-limit');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require('lusca').csrf;
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Vérifier la présence du SECRET
if (!process.env.SECRET) {
  console.error("ERREUR: La variable SECRET n'est pas définie dans le fichier .env");
  process.exit(1);
}

// Middlewares de base - à définir avant les routes
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// Limiteur de requêtes
const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max 200 requests per windowMs
});
app.use(limiter);

// Middlewares pour cookies, sessions et CSRF
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ 
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000, // 1 heure
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    } 
}));

// CSRF Protection configurée une seule fois
const csrfProtection = csrf({ 
    cookie: { 
        key: '_csrf',
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 3600000 
    },
    ignoreMethods: []
});

/**
 * Injects CSRF token into HTML file and sends the response
 * @param {string} filePath - Path to the HTML file
 * @param {object} res - Express response object
 * @param {object} req - Express request object
 * @param {string} csrfToken - CSRF token to inject
 */
function injectCSRFToken(filePath, res, req, csrfToken) {
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            console.error(`Error reading HTML file ${filePath}:`, err);
            return res.status(500).send('Server Error');
        }
        
        // Use a more specific regex to ensure we only replace the right meta tag
        const metaTagRegex = /<meta\s+name=["']csrf-token["']\s+content=["'].*?["']\s+id=["']csrf-token-meta["']\s*\/?>/i;
        
        if (!metaTagRegex.test(html)) {
            console.warn(`CSRF meta tag not found in ${filePath}`);
        }
        
        const modifiedHtml = html.replace(
            metaTagRegex, 
            `<meta name="csrf-token" content="${csrfToken}" id="csrf-token-meta">`
        );
        
        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedHtml);
    });
}

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration WebSocket
setupWebSocket(server);

connectDB();

// IMPORTANT: Appliquer csrfProtection AVANT de définir les routes
app.use(csrfProtection);
app.use((req, res, next) => {
    console.log(`[DEBUG] Route: ${req.method} ${req.path}`);
    console.log(`[DEBUG] CSRF Headers: ${req.headers['csrf-token'] || req.headers['x-csrf-token'] || 'Aucun'}`);
    console.log(`[DEBUG] CSRF Body: ${req.body && req.body._csrf ? 'Présent' : 'Absent'}`);
    next();
  });

// Routes de pages avec injection CSRF
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public/html/home.html');
    const csrfToken = req.csrfToken();
    injectCSRFToken(filePath, res, req, csrfToken);
});

app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'public/html/login.html');
    const csrfToken = req.csrfToken();
    injectCSRFToken(filePath, res, req, csrfToken);
});

app.get('/document', (req, res) => {
    const filePath = path.join(__dirname, 'public/html/doc.html');
    const csrfToken = req.csrfToken();
    injectCSRFToken(filePath, res, req, csrfToken);
});

app.get('/documents', (req, res) => {
    const filePath = path.join(__dirname, 'public/html/docs.html');
    const csrfToken = req.csrfToken();
    injectCSRFToken(filePath, res, req, csrfToken);
});

// Routes API - déjà protégées par csrfProtection
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/collaborateur', collaborateurRoutes); 
app.use('/document', documentRoutes);

server.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));