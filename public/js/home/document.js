let btn_suivant = document.querySelector('.btn_suivant');
let btn_precedent = document.querySelector('.btn_precedent');
let div_documents = document.querySelectorAll('.div_document');
let div_document_historique = document.querySelector('.div_document_historique');
let div_fin_de_doc = document.querySelector('.div_fin_de_doc');
let div_new_doc_btn = document.querySelector('.div_new_doc_btn');


let actual_offset = 0;

if (div_documents.length >= 4) {
    btn_suivant.style.display = 'flex';
}

// quand la molette de la souris est utilisée
document.addEventListener('wheel', function (e) {
    if (e.target.closest('.div_document_historique')) {
        if (e.deltaY > 0) {
            if (actual_offset + 200 >= (div_documents.length - 1) * 100) {
                btn_suivant.style.display = 'none';
                return;
            }

            btn_precedent.style.display = 'flex';

            for (let i = 0; i < div_documents.length; i++) {
                div_documents[i].style.transform = `translateX(-${actual_offset + 100}%)`;
                div_fin_de_doc.style.transform = `translateX(-${actual_offset + 100}%)`;
            }
            actual_offset += 100;
        } else {
            if (actual_offset === 0) {
                btn_precedent.style.display = 'none';
                return;
            }

            btn_suivant.style.display = 'flex';

            for (let i = 0; i < div_documents.length; i++) {
                div_documents[i].style.transform = `translateX(-${actual_offset - 100}%)`;
                div_fin_de_doc.style.transform = `translateX(-${actual_offset - 100}%)`;
            }
            actual_offset -= 100;
        }
    }
});

btn_suivant.addEventListener('click', function () {
    console.log(actual_offset);

    if (actual_offset + 300 >= (div_documents.length - 1) * 100) {
        btn_suivant.style.display = 'none';
    }

    btn_precedent.style.display = 'flex';

    for (let i = 0; i < div_documents.length; i++) {
        div_documents[i].style.transform = `translateX(-${actual_offset + 100}%)`;
        div_fin_de_doc.style.transform = `translateX(-${actual_offset + 100}%)`;
    }
    actual_offset += 100;
});
btn_suivant.addEventListener('dblclick', function () {
    // aller à la fin
    for (let i = 0; i < div_documents.length; i++) {
        div_documents[i].style.transform = `translateX(-${(div_documents.length - 3) * 100}%)`;
        div_fin_de_doc.style.transform = `translateX(-${(div_documents.length - 3) * 100}%)`;
    }
    actual_offset = (div_documents.length - 3) * 100;
    btn_suivant.style.display = 'none';
    btn_precedent.style.display = 'flex';
});

btn_precedent.addEventListener('click', function () {
    console.log(actual_offset);

    if (actual_offset === 0 || actual_offset === 100) {
        btn_precedent.style.display = 'none';
    }

    btn_suivant.style.display = 'flex';

    for (let i = 0; i < div_documents.length; i++) {
        div_documents[i].style.transform = `translateX(-${actual_offset - 100}%)`;
        div_fin_de_doc.style.transform = `translateX(-${actual_offset - 100}%)`;
    }
    actual_offset -= 100;
});

btn_precedent.addEventListener('dblclick', function () {
    // aller au début
    for (let i = 0; i < div_documents.length; i++) {
        div_documents[i].style.transform = `translateX(0%)`;
        div_fin_de_doc.style.transform = `translateX(0%)`;
    }
    actual_offset = 0;
    btn_precedent.style.display = 'none';
    btn_suivant.style.display = 'flex';
});

function get_time_difference(date) {
    let date_modif = new Date(date);
    time = new Date() - date_modif;
    time = Math.floor(time / 1000);
    if (time < 60) {
        time = `${time} secondes`;
    } else {
        time = Math.floor(time / 60);
        if (time < 60) {
            time = `${time} minutes`;
        } else {
            time = Math.floor(time / 60);
            if (time < 24) {
                time = `${time} heures`;
            } else {
                time = Math.floor(time / 24);
                time = `${time} jours`;
            }
        }
    }
    return time;
}

function add_document_to_page(title, content, time, id) {
    let div_document = document.createElement('div');
    div_document.className = 'div_document';
    div_document.id = id;

    let encode_id_with_base64 = btoa(id);

    div_document.addEventListener('click', function () {
        window.location.href = `/document?doc=${encode_id_with_base64}`;
    });

    let h3 = document.createElement('h3');
    h3.textContent = title;
    div_document.appendChild(h3);

    let h4 = document.createElement('div');
    h4.className = 'h4';
    h4.innerHTML = content;
    div_document.appendChild(h4);

    // transformer tout les enfant texte de h4 en span
    h4.childNodes.forEach(node => {
        let span = document.createElement('span');
        span.textContent = node.textContent;
        node.replaceWith(span);
    }
    );




    let p = document.createElement('p');
    p.innerHTML = `Dernière modification il y a : <b>${get_time_difference(time)}</b>`;
    div_document.appendChild(p);

    setInterval(() => {
        p.innerHTML = `Dernière modification il y a : <b>${get_time_difference(time)}</b>`;
    }, 1000);

    return div_document;
}

async function get_documents() {
    let response = await fetch('/document/get_last_ten_documents');
    let data = await response.json();
    data.forEach(doc => {
        let new_doc = add_document_to_page(doc.title, doc.content, doc.date, doc.id);
        div_document_historique.appendChild(new_doc);
    });
    div_documents = document.querySelectorAll('.div_document');
    if (div_documents.length >= 4) {
        btn_suivant.style.display = 'flex';
    }
}

get_documents();

async function new_document() {
    fetch('/document/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Nouveau document',
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            let encode_id_with_base64 = btoa(data.doc_id);
            window.location.href = `/document?doc=${encode_id_with_base64}`;
        })
}

async function delete_document(id) {
    fetch('/document/delete/' + id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById(id).remove();
            div_documents = document.querySelectorAll('.div_document');
            if (div_documents.length < 4) {
                btn_suivant.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


let final_click = false;
let first_click = false;
div_new_doc_btn.addEventListener('click', function () {
    if (!first_click) {
        div_new_doc_btn.style.backgroundColor = 'var(--ultra-constrast-yellow)';
        first_click = true;
        setTimeout(() => {
            if (!final_click && first_click) {
                div_new_doc_btn.style.backgroundColor = 'var(--background-color)';
                final_click = false;
                first_click = false;
            }
        }, 500);
    } else {
        new_document();
        final_click = true;
        first_click = false;
        div_new_doc_btn.style.backgroundColor = 'var(--background-color)';
    }

});