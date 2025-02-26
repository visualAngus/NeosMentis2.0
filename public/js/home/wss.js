const ws = new WebSocket('ws://localhost:5000');
let list_notif = [];

ws.onopen = () => {
    console.log('WebSocket connecté');
    changeStatut('En ligne');
};

ws.onmessage = (event) => {
    let parsedMessage = JSON.parse(event.data);
    if (parsedMessage.action === 'notification') {
        list_notif.push(parsedMessage.message);
        changeNotifNumber(list_notif.length);

        if (list_notif.length === 1) {
            changeNotifBar(parsedMessage.message);
        }else{  
            changeNotifBar(parsedMessage.message,`Vous avez ${list_notif.length} nouvelles notifications`);
        }
        console.log('Notification reçue :', parsedMessage.message);
    }
    if (parsedMessage.action === 'statut') {
        changeStatut(parsedMessage.message);
    }
};

ws.onclose = () => {
    console.log('WebSocket fermé');
};

function sendMessage(type, message) {
    console.log('Envoi du message de log :', type, message);
    ws.send(JSON.stringify({action: type, message: message}));
}

function sendMessageToSpecificClient(message, client,type) {
    console.log('Envoi du message :', message);
    ws.send(JSON.stringify({action: 'message', message: message, id: client, type: type}));
}

setTimeout(() => {
    sendMessageToSpecificClient('hello !!', 7,"notification");
}, 100);