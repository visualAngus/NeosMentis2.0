function documents(title, date, content, id) {
    const container = document.createElement('div');
    container.className = 'div_doc_pre';

    // encode en base64
    id = btoa(id);

    container.id = id;

    container.addEventListener('click', () => {
        window.location.href = `/document?doc=${id}`;
    });


    const titleDiv = document.createElement('div');
    titleDiv.className = 'div_titre_doc';

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;

    const dateElement = document.createElement('p');
    dateElement.textContent = date;

    titleDiv.appendChild(titleElement);
    titleDiv.appendChild(dateElement);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'div_content_doc';
    contentDiv.innerHTML = content;

    container.appendChild(titleDiv);
    container.appendChild(contentDiv);

    return container;
}

async function getDocuments() {
    fetch('/document/all')
        .then((response) => response.json())
        .then((data) => {
            const docsContainer = document.querySelector('.div_all_docs');
            data.forEach(doc => {
                const docElement = documents(doc.title, doc.date, doc.content, doc.id);
                docsContainer.appendChild(docElement);
            });
            
        });
}
getDocuments();


document.querySelector('.div_new_doc').addEventListener('click', new_document);


async function new_document() {

    const headers = {
        "Content-Type": "application/json"
    };
    
    if (csrfToken) {
        headers['CSRF-Token'] = csrfToken;
        headers['X-CSRF-Token'] = csrfToken;
        headers['csrf-token'] = csrfToken;
        headers['_csrf'] = csrfToken;
    }


    fetch('/document/create', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            title: 'Nouveau document',
        }),
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            let encode_id_with_base64 = btoa(data.doc_id);
            window.location.href = `/document?doc=${encode_id_with_base64}`;
        })
}