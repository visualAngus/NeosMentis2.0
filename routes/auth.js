const express = require('express');
const cookieParser = require('cookie-parser');
const lusca = require('lusca');
const { executeQuery } = require('../config/db');
const { hashPassword, verifyPassword,generateToken,verificationAll,generateSecondaryKey,verifyGoogleToken } = require('../utils/crypto');

const router = express.Router();
router.use(cookieParser());
router.use(lusca.csrf());
// Route d'inscription
router.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    
    if (!username || !password || !email) return res.status(400).json({ error: 'Champs requis' });
    try {
        // Vérifier si l'utilisateur existe déjà
        const [rows] = await executeQuery('SELECT * FROM users WHERE username = ?', [username]);
        if (rows != null) return res.status(400).json({ error: 'Utilisateur déjà existant' });

        const [rows2] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (rows2 != null) return res.status(400).json({ error: 'Email déjà existant' });

        // Hash du mot de passe
        const hashedPassword = await hashPassword(password);
        // Insérer l'utilisateur dans la base de données
        const new_user = await executeQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', [username, hashedPassword, email,"0"]);
        
        const secondaryKey = generateSecondaryKey(password);
        const token = generateToken(username, new_user.insertId,false,"","0",secondaryKey);

        // rajouter le token dans les cookies
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' , maxAge: 3600000});

        res.json({success: true, message: 'Utilisateur créé',data : {username,email,role:"0"} });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Route de connexion
router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) return res.status(400).json({ error: 'Champs requis' });
    try {
        // Vérifier sis l'utilisateur existe
        const [rows] = await executeQuery('SELECT * FROM users WHERE username = ?', [username]);
        if (rows == null) return res.status(400).json({ error: 'Utilisateur inexistant' });
        // Vérifier le mot de passe
        const match = await verifyPassword(password, rows.password);
        if (!match) return res.status(400).json({ error: 'Mot de passe incorrect' });

        // Générer un token JWT
        const secondaryKey = generateSecondaryKey(rows.password);
        const token = generateToken(rows.username, rows.id_user,false,"",rows.role,secondaryKey);

        // rajouter le token dans les cookies
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 3600000 });

        
        let data_user = {username:rows.username,email:rows.email,role:rows.role};
        res.json({ success: true, message: 'Connexion réussie',data : data_user});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Route de déconnexion
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Déconnexion réussie' });
});
// Route de vérification du token
router.get('/verify', (req, res) => {
    // Récupérer le token
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Accès non autorisé' });
    const data = verificationAll(req, res); 
    if (!data) return res.status(401).json({ error: 'Accès non autorisé' });
    res.json({success: true});
});
router.post('/login_google', async (req, res) => {
    const { username, email, google_key } = req.body;
    const google_auth = true;
    if (!username || !email || !google_auth || !google_key) return res.status(400).json({ error: 'Champs requis' });
    
    const [rows] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (rows != null) {
        const secondaryKey = generateSecondaryKey(google_key);
        const token = generateToken(username, rows.id_user, google_auth, google_key, rows.role, secondaryKey);
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 3600000 });
        return res.json({ success: true, message: 'Connexion réussies', data: { username, email, role: rows.role } });
    } else {
        const hashedKey = await hashPassword(google_key);
        const new_user = await executeQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', [username, hashedKey, email, "0"]);
        const secondaryKey = generateSecondaryKey(google_key);
        const token = generateToken(username, new_user.insertId, google_auth, google_key, "0", secondaryKey);
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 3600000 });
        return res.json({ success: true, message: 'Enregistrement et connexion réussies', data: { username, email, role: "0" } });
    }
});
router.get('/auto_google_login', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) return res.status(401).json({ error: 'Non autorisé' });

    if (data.google_auth) {
        let google_key = data.google_key;
        verifyGoogleToken(google_key).then(async (response) => {
            if (!response) return res.status(400).json({ error: 'Token invalide' });

            const [verif_user] = await executeQuery('SELECT * FROM users WHERE id_user = ?', [data.userID]);
            if (!verif_user) return res.status(400).json({ error: 'Utilisateur inexistant' });

            if (await verifyPassword(google_key, verif_user.password)) {
                const secondaryKey = generateSecondaryKey(google_key);
                const token = generateToken(data.username, data.userID, data.google_auth, data.google_key, data.role, secondaryKey);
                return res.json({ success: true, message: 'Connexion réussie', data: { username: data.username, email: data.email, role: data.role ,credential: google_key} });
            } else {
                return res.status(400).json({ error: 'Mot de passe incorrect' });
            }
        });
    }
});
// verifier si l'email existe
router.post('/verify_email', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Champs requis' });
    const [rows] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (rows != null) return res.status(400).json({ error: 'Email déjà existant' });
    return res.json({ success: true, message: 'Email disponible' });
});

module.exports = router;
