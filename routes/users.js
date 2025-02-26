const express = require('express');
const cookieParser = require('cookie-parser');
const { executeQuery } = require('../config/db');
const { verificationAll } = require('../utils/crypto');

const router = express.Router();

router.use(cookieParser());


router.get('/get_info', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    try {
        const [rows] = await executeQuery('SELECT users.id_user, users.username, users.email, users.role FROM users WHERE id_user = ?', [data.userID]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
