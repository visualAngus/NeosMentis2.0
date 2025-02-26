const express = require('express');
const cookieParser = require('cookie-parser');
const { executeQuery } = require('../config/db');
const { verificationAll,generateDocumentKey,encryptWithSecondaryKey,decryptDocument,encryptKeyWithSecondaryKey ,getDocumentKey} = require('../utils/crypto');
const { decrypt } = require('dotenv');

const router = express.Router();
router.use(cookieParser());
router.use(express.json());
// Route de création de document
router.post('/create', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const title = req.body.title;
    const content =  " ";


    const doc_key = generateDocumentKey(data.userKey, title);

    const encrypt_doc_key = encryptKeyWithSecondaryKey(Buffer.from(doc_key).toString('hex'), data.secondaryKey);

    const encrypt_doc = encryptWithSecondaryKey(content, Buffer.from(doc_key).toString('hex'));


    if (!title || !content) return res.status(400).json({ error: 'Champs requis' });
    try {
        // generate document id 5lettre 6 chiffre trois lettre
        let doc_id_gen = Math.random().toString(36).substring(2, 7) + Math.floor(100000 + Math.random() * 900000) + Math.random().toString(36).substring(2, 5);

        // verifier si cette id n'existe pas deja
        let row5 = await executeQuery('SELECT * FROM documents WHERE id_document = ?', [doc_id_gen]);
        let count = 0;
        while (row5.length == 0) {
            doc_id_gen = Math.random().toString(36).substring(2, 7) + Math.floor(100000 + Math.random() * 900000) + Math.random().toString(36).substring(2, 5);
            row5 = await executeQuery('SELECT * FROM documents WHERE id_document = ?', [doc_id_gen]);
            count++;
            if (count > 10) return res.status(500).json({ error: 'Erreur serveur' });
        }

        const row = await executeQuery('INSERT INTO documents (id_document,title, content, iv, authTag) VALUES (?,?, ?, ?, ?)', [doc_id_gen,title, encrypt_doc.encryptedData, encrypt_doc.iv, encrypt_doc.authTag]);
        let doc_id = row.insertId;
        const row2 = await executeQuery('INSERT INTO document_version_connecteur (document_id_link,document_version_link) VALUES (?,?)', [doc_id_gen,doc_id]);

        await executeQuery('INSERT INTO user_documents (user_id_link, document_id_link, doc_key, iv, authTag) VALUES (?, ?, ?, ?, ?)', [data.userID, doc_id_gen, encrypt_doc_key.encryptedData, encrypt_doc_key.iv, encrypt_doc_key.authTag]);
        
        res.status(201).json({ message: 'Document créé' , doc_id: doc_id_gen});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route recupération de tous les documents
router.get('/all', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
        const row = await executeQuery(`SELECT * 
                        FROM user_documents 
                        LEFT JOIN document_version_connecteur on user_documents.document_id_link = document_version_connecteur.document_id_link
                        WHERE user_id_link = ?  AND etat = 0 
                        GROUP BY user_documents.document_id_link
                        ORDER BY MAX(document_version_connecteur.date) DESC`, [data.userID]);
        if (row.length === 0) return res.status(404).json({ error: 'Document non trouvé' });
        let docs = [];
        for (let i = 0; i < row.length; i++) {
            const doc_version = await executeQuery('SELECT document_version_link,id_connecteur FROM document_version_connecteur WHERE document_id_link = ? ORDER BY date DESC LIMIT 1', [row[i].document_id_link]);
            const doc = await executeQuery('SELECT * FROM documents WHERE auto_id_doc = ?', [doc_version[0].document_version_link]);
            if (doc.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

            const encrypt_doc_key = { encryptedData: row[i].doc_key, iv: row[i].iv, authTag: row[i].authTag };
            const doc_info = { content: doc[0].content, iv: doc[0].iv, authTag: doc[0].authTag };

            var decrypt = decryptDocument(encrypt_doc_key, data.secondaryKey, doc_info);
            // prendre que les 50 premiers caractères
            // decrypt = decrypt.slice(0, 50);

            docs.push({ id:row[i].document_id_link,version: doc_version[0].id_connecteur, title: doc[0].title, content: decrypt, date: doc[0].date });
        }
        res.status(200).json(docs);
    
});

//routes de récupération des 10 derniers documents
router.get('/get_last_ten_documents', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
        const row = await executeQuery(`SELECT * 
                        FROM user_documents 
                        LEFT JOIN document_version_connecteur on user_documents.document_id_link = document_version_connecteur.document_id_link
                        WHERE user_id_link = ?  AND etat = 0 
                        GROUP BY user_documents.document_id_link
                        ORDER BY MAX(document_version_connecteur.date) DESC LIMIT 10`, [data.userID]);
        if (row.length === 0) return res.status(404).json({ error: 'Document non trouvé' });
        let docs = [];
        if (row[0] == null) return res.status(404).json({ error: 'Aucun document trouvé' });
        for (let i = 0; i < row.length; i++) {
            const doc_version = await executeQuery('SELECT document_version_link,id_connecteur,date FROM document_version_connecteur WHERE document_id_link = ? ORDER BY date DESC LIMIT 1', [row[i].document_id_link]);
            console.log(doc_version);
            const doc = await executeQuery('SELECT * FROM documents WHERE auto_id_doc = ?', [doc_version[0].document_version_link]);
            if (doc.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

            const encrypt_doc_key = { encryptedData: row[i].doc_key, iv: row[i].iv, authTag: row[i].authTag };
            const doc_info = { content: doc[0].content, iv: doc[0].iv, authTag: doc[0].authTag };

            var decrypt = decryptDocument(encrypt_doc_key, data.secondaryKey, doc_info);
            // prendre que les 50 premiers caractères
            decrypt = decrypt.slice(0, 50);

            docs.push({ id:row[i].document_id_link,version: doc_version[0].id_connecteur, title: doc[0].title, content: decrypt, date: doc_version[0].date });
        }
        res.status(200).json(docs);
});

// Route de récupération de document
router.get('/get/:id', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const doc_id = req.params.id;
    try {
        const row = await executeQuery('SELECT * FROM user_documents WHERE user_id_link = ? AND document_id_link = ? AND etat = 0', [data.userID, doc_id]);
        if (row.length === 0) return res.status(404).json({ error: 'Document non trouvé' });
        const doc_version = await executeQuery('SELECT document_version_link,id_connecteur FROM document_version_connecteur WHERE document_id_link = ? ORDER BY date DESC LIMIT 1', [doc_id]);
        const doc = await executeQuery('SELECT * FROM documents WHERE auto_id_doc = ?', [doc_version[0].document_version_link]);
        if (doc.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

        const encrypt_doc_key = { encryptedData: row[0].doc_key, iv: row[0].iv, authTag: row[0].authTag };
        const doc_info = { content: doc[0].content, iv: doc[0].iv, authTag: doc[0].authTag };

        const decrypt = decryptDocument(encrypt_doc_key, data.secondaryKey, doc_info);

        res.status(200).json({ title: doc[0].title,version: doc_version[0].id_connecteur, content: decrypt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de mise à jour de document
router.post('/update/:id', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const doc_id = req.params.id;
    const title = req.body.title;
    const content = req.body.content;
    if (!title || !content) return res.status(400).json({ error: 'Champs requis' });

    try {
        const row = await executeQuery('SELECT * FROM user_documents WHERE user_id_link = ? AND document_id_link = ?', [data.userID, doc_id]);
        if (row.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

        const doc_version = await executeQuery('SELECT document_version_link,id_connecteur FROM document_version_connecteur WHERE document_id_link = ? ORDER BY date DESC LIMIT 1', [doc_id]);
        const doc = await executeQuery('SELECT * FROM documents WHERE auto_id_doc = ?', [doc_version[0].document_version_link]);
        if (doc.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

        const doc_key = getDocumentKey(data.secondaryKey, { encryptedData: row[0].doc_key, iv: row[0].iv, authTag: row[0].authTag });

        const encrypt_doc = encryptWithSecondaryKey(content, doc_key);

        const row2 = await executeQuery('INSERT INTO documents (id_document,title, content, iv, authTag) VALUES (?,?, ?, ?, ?)', [doc_id,title, encrypt_doc.encryptedData, encrypt_doc.iv, encrypt_doc.authTag]);
        let doc_id_new = row2.insertId;
        const row3 = await executeQuery('INSERT INTO document_version_connecteur (document_id_link,document_version_link) VALUES (?,?)', [doc_id,doc_id_new]);

        res.status(200).json({ message: 'Document mis à jour' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de suppression de document
router.get('/delete/:id', async (req, res) => {
    let data = verificationAll(req, res);
    if (!data) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    const doc_id = req.params.id;
    try {
        const row = await executeQuery('SELECT * FROM user_documents WHERE user_id_link = ? AND document_id_link = ? AND etat = 0', [data.userID, doc_id]);
        if (row.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

        await executeQuery('UPDATE user_documents SET etat = 1 WHERE user_id_link = ? AND document_id_link = ?', [data.userID, doc_id]);

        res.status(200).json({ message: 'Document supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;