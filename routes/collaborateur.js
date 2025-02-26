const express = require('express');
const cookieParser = require('cookie-parser');
const { executeQuery } = require('../config/db');
const { verificationAll } = require('../utils/crypto');

const router = express.Router();

router.use(cookieParser());

router.get('/get_all_collaborateur_by_user', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    try {
        const [rows] = await executeQuery(`
            SELECT collaborateur.id_link_collaborateur, users.username, users.role,users.id_user
            FROM collaborateur
            JOIN users ON (collaborateur.collaborateur1 = users.id_user OR collaborateur.collaborateur2 = users.id_user)
            WHERE (collaborateur.collaborateur1 = ? OR collaborateur.collaborateur2 = ?)
            AND users.id_user <> ?
        `, [data.userID, data.userID, data.userID]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/send_request_to_collaborateur', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const { id_collaborateur } = req.body;
    if (!id_collaborateur) {
        return res.status(400).json({ error: 'Champs requis' });
    }
    try {

        const [existing] = await executeQuery(`
            SELECT 1
            FROM collaborateur
            WHERE (collaborateur1 = ? AND collaborateur2 = ?)
              OR (collaborateur1 = ? AND collaborateur2 = ?)
        `, [id_collaborateur, data.userID, data.userID, id_collaborateur]);
        if (existing) {
            return res.status(400).json({ error: 'Déjà collaborateur' });
        }

        const [rows] = await executeQuery('SELECT * FROM request_collaborateur WHERE id_user = ? AND id_collaborateur = ?', [data.userID, id_collaborateur]);
        if (rows == null) {
            await executeQuery('INSERT INTO request_collaborateur (id_user, id_collaborateur) VALUES (?, ?)', [data.userID, id_collaborateur]);
            return res.json({ success: true, message: 'Demande envoyée' });
        }   
        return res.status(400).json({ error: 'Demande déjà envoyée' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get("/get_request_collaborateur", async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    try {
        const [rows] = await executeQuery(`
            SELECT request_collaborateur.id_request, users.username, users.role,users.id_user
            FROM request_collaborateur
            JOIN users ON request_collaborateur.id_user = users.id_user
            WHERE request_collaborateur.id_collaborateur = ?
        `, [data.userID]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/accept_request_collaborateur', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const { id_request } = req.body;
    if (!id_request) {
        return res.status(400).json({ error: 'Champs requis' });
    }
    try {
        const [rows] = await executeQuery('SELECT * FROM request_collaborateur WHERE id_request = ?', [id_request]);
        if (rows == null) {
            return res.status(400).json({ error: 'Demande inexistante' });
        }

        if (rows.id_collaborateur !== data.userID) {
            return res.status(400).json({ error: 'Non autorisé' });
        }

        const [existing] = await executeQuery(`
            SELECT 1
            FROM collaborateur
            WHERE (collaborateur1 = ? AND collaborateur2 = ?)
              OR (collaborateur1 = ? AND collaborateur2 = ?)
        `, [rows.id_user, data.userID, data.userID, rows.id_user]);
        if (existing) {
            return res.status(400).json({ error: 'Déjà collaborateur' });
        }

        await executeQuery('INSERT INTO collaborateur (collaborateur1, collaborateur2) VALUES (?, ?)', [rows.id_user, data.userID]);
        await executeQuery('DELETE FROM request_collaborateur WHERE id_request = ?', [id_request]);
        res.json({ success: true, message: 'Demande acceptée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }

});

router.post("/research_collaborateur", async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Champs requis' });
    }
    try {
        const [rows] = await executeQuery(`
            SELECT id_user, username, role
            FROM users
            WHERE username LIKE ?
            AND id_user <> ?
        `, [username + '%', data.userID]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post("/research_user", async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Champs requis' });
    }
    try {
        const [rows] = await executeQuery(`
            SELECT id_user, username, role
            FROM users
            WHERE username LIKE ? OR email LIKE ?
        `, [username + '%', username + '%']);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post("/delete_collaborateur", async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const { id_collaborateur } = req.body;
    if (!id_collaborateur) {
        return res.status(400).json({ error: 'Champs requis' });
    }
    try {
        const [rows] = await executeQuery(`
            SELECT 1
            FROM collaborateur
            WHERE (collaborateur1 = ? AND collaborateur2 = ?)
              OR (collaborateur1 = ? AND collaborateur2 = ?)
        `, [id_collaborateur, data.userID, data.userID, id_collaborateur]);
        if (rows == null) {
            return res.status(400).json({ error: 'Collaborateur inexistant' });
        }

        await executeQuery(`
            DELETE FROM collaborateur
            WHERE (collaborateur1 = ? AND collaborateur2 = ?)
              OR (collaborateur1 = ? AND collaborateur2 = ?)
        `, [id_collaborateur, data.userID, data.userID, id_collaborateur]);
        res.json({ success: true, message: 'Collaborateur supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
