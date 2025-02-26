const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {OAuth2Client} = require('google-auth-library');


const saltRounds = 10;
const SECRET_KEY = fs.readFileSync(path.join(__dirname, '../certs/private-key.pem'), 'utf8').trim();
const CLIENT_ID  =  "933726926443-mfo0gij5g3f8pol7a6c0icj5h3pl7rtg.apps.googleusercontent.com"

const client = new OAuth2Client(CLIENT_ID);


// fonction de hashage du mot de passe
async function hashPassword(password) {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}
// fonction de vérification du mot de passe
async function verifyPassword(password, hash) {
    const match = await bcrypt.compare(password, hash);
    return match;
}
// Fonction pour générer un token JWT
function generateToken(name,id, google_auth,google_key,role,secondaryKey) {
    const payload = {
        username: name,
        userID: id,
        google_auth : google_auth,
        google_key : google_key,
        role: role,
        secondaryKey: secondaryKey.toString('hex')
    };
    const options = {};
    return jwt.sign(payload, SECRET_KEY, options);
}
// Fonction pour vérifier un token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY); // Vérifie le token et retourne son contenu décodé si valide
    } catch (error) {
        return null; // Retourne null si le token est invalide ou expiré
    }
}
// fonction pour tout verifier
function verificationAll(req, res) {
    // get le token 
    const token = req.cookies.token;
    if (!token) {
        return false;
    }

    const data = verifyToken(token);
    if (!data) {
        return false;
    }

    if (data) {
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 3600000 });
    }
    
    return data;
}

function encryptTexteWithPrimaryKey(text, primaryKey) {
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const key = crypto.createHash('sha256').update(primaryKey).digest(); // Hash the primary key to ensure it is 256 bits
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // Tag pour vérifier l'intégrité du chiffrement

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function DecryptTexteWithPrimaryKey(encryptedData, primaryKey, iv, authTag) {
    const key = crypto.createHash('sha256').update(primaryKey).digest(); // Hash the primary key to ensure it is 256 bits
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function getDocumentKey(userSecondaryKey, encryptedDocKey) {
    const decipherKey = crypto.createDecipheriv(
        'aes-256-gcm',
        crypto.createHash('sha256').update(userSecondaryKey).digest(),
        Buffer.from(encryptedDocKey.iv, 'hex')
    );
    decipherKey.setAuthTag(Buffer.from(encryptedDocKey.authTag, 'hex'));

    
    
    let docKey = decipherKey.update(encryptedDocKey.encryptedData, 'hex', 'utf8');
    docKey += decipherKey.final('utf8');
    return docKey;
}
// Fonction pour générer une clé secondaire à partir de la clé primaire et du mot de passe
function generateSecondaryKey(password) {
    const salt = crypto.createHash('sha256').update(SECRET_KEY).digest();
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}
// Fonction pour chiffrer le texte avec la clé secondaire
function encryptWithSecondaryKey(text, secondaryKey) {
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const key = crypto.createHash('sha256').update(secondaryKey).digest(); // Ensure the key is 256 bits
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // Tag pour vérifier l'intégrité du chiffrement

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function encryptKeyWithSecondaryKey(key_, secondaryKey) {
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const key = crypto.createHash('sha256').update(secondaryKey).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(key_, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}


function encryptDocument(text, userSecondaryKey, encryptedDocKey) {
    // 1) Déchiffrer la clé du document avec la clé secondaire de l’utilisateur
    const decipherKey = crypto.createDecipheriv(
        'aes-256-gcm',
        userSecondaryKey,
        Buffer.from(encryptedDocKey.iv, 'hex')
    );
    decipherKey.setAuthTag(Buffer.from(encryptedDocKey.authTag, 'hex'));

    let docKey = decipherKey.update(encryptedDocKey.encryptedData, 'hex', 'utf8');
    docKey += decipherKey.final('utf8');

    // 2) Chiffrer le texte avec la clé du document
    const iv = crypto.randomBytes(16); // Génère un IV aléatoire
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(docKey, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function generateDocumentKey(primaryKey, docIdentifier) {
    // Ajout d'une valeur aléatoire sécurisée
    const randomValue = crypto.randomBytes(16).toString('hex');
    // Combine primaryKey + docIdentifier + valeur aléatoire
    return crypto.createHash('sha256').update(primaryKey + docIdentifier + randomValue).digest();
}

function DecryptTexteWithKey(encryptedData, key, iv, authTag) {
    const keyBuffer = crypto.createHash('sha256').update(key).digest(); // Hash the primary key to ensure it is 256 bits
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function decryptDocument(encryptedDocKey, userSecondaryKey, encryptedData) {
    if (!encryptedDocKey.iv || !encryptedDocKey.authTag || !encryptedDocKey.encryptedData) {
        throw new Error("Invalid encryptedDocKey format");
    }
    if (!encryptedData.iv || !encryptedData.authTag || !encryptedData.content) {
        throw new Error("Invalid encryptedData format");
    }
    if (!userSecondaryKey) {
        throw new Error("User secondary key is required");
    }

    // decript the document key
    const docKey = getDocumentKey(userSecondaryKey, encryptedDocKey);
    console.log("docKey",docKey);
    // decript the document
    const decrypted = DecryptTexteWithKey(encryptedData.content, docKey, encryptedData.iv, encryptedData.authTag);
    return decrypted;
}

async function verifyGoogleToken(credential) {
    try{
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,  // Peut être un tableau d'IDs pour plus de sécurité
        });
        const payload = ticket.getPayload();

        return payload;
    }catch(error){
        return null;
    }
    
    // Tu peux maintenant récupérer les informations supplémentaires de Google People API
}
// Fonction pour déchiffrer le texte avec la clé secondaire
function decryptWithSecondaryKey(encryptedData, secondaryKey, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', secondaryKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    verificationAll,
    encryptTexteWithPrimaryKey,
    DecryptTexteWithPrimaryKey,
    generateSecondaryKey,
    encryptWithSecondaryKey,
    encryptDocument,
    generateDocumentKey,
    decryptDocument,
    verifyGoogleToken,
    encryptKeyWithSecondaryKey,
    getDocumentKey
};