
let csrfToken;
try {
    const metaElement = document.querySelector('meta[name="csrf-token"]');
    csrfToken = metaElement ? metaElement.getAttribute('content') : null;
    console.log('CSRF Token:', csrfToken);
} catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    csrfToken = null;
}
let titre_doc="";
let last_save = Date.now();
// Récupérer le token CSRF de la balise meta

function getDoc() {
    // get doc
    fetch("/document/get/" + doc, {
        headers: {
            // Ajouter le token CSRF à l'en-tête
            'CSRF-Token': csrfToken || ''
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            titre_doc = data.title; 
            document.querySelector('#titre').value = data.title;
            // data_json = JSON.parse(data.content);  
            quill.root.innerHTML =data.content;

            // document.querySelector('.content').textContent = data.content;

            inisializeRightMenu();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function save_doc(auto = 1){
    if (auto == 1 && Date.now() - last_save < 5000) {
        return;
    }

    console.log("Saving");
    var content = quill.root.innerHTML;
    var title = document.querySelector('#titre').value;
    

    const headers = {
        "Content-Type": "application/json"
    };
    
    // Ajouter le token CSRF avec tous les noms d'en-tête possibles
    if (csrfToken) {
        headers['CSRF-Token'] = csrfToken;
        headers['X-CSRF-Token'] = csrfToken;
        headers['csrf-token'] = csrfToken;
        headers['_csrf'] = csrfToken;
    }


    fetch("/document/update/" + doc, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ title, content }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de sauvegarde');
        }
        return response.json();
    })
    .then(data => {
        console.log('Sauvegarde réussie:', data);
    })
    .catch(error => {
        console.error('Erreur de sauvegarde:', error);
    });
    
    last_save = Date.now();
}

window.addEventListener('input', function() {
    save_doc();
});
// si control + s alors save
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        save_doc(0);
    }
});