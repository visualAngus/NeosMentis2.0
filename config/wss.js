const WebSocket = require('ws');
let wss_var;
const users_conn = new Map();


const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    console.log('Serveur WebSocket démarré');

    wss.on('connection', (ws, req) => {
        ws.on('message', (message) => {
            let parsedMessage = JSON.parse(message);

            console.log('Message reçu :', parsedMessage);

            if (parsedMessage.action === 'login') {
                let id = parsedMessage.message;  
                users_conn.set(id, ws);
            } else if (parsedMessage.action === 'message') {
                let id = parsedMessage.id;
                let message = parsedMessage.message;
                let type = parsedMessage.type;
                
                if (users_conn.has(id)) {
                    let client = users_conn.get(id);
                    broadcastMessageToSpecificClient(type, message, client);
                }
            }

            // afficher les clients connectés mais que l'id pas le ws
            console.log(users_conn.keys()); 

        });

        ws.on('close', () => {  
            console.log('Connexion fermée');
        });
    });

    return wss;
};


function broadcastMessageToSpecificClient(type, message, client) {
    client.send(JSON.stringify({action: type, message: message}));
}


module.exports = { setupWebSocket };
