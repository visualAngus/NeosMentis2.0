let all_btn_menu =[];
let all_sous_menu = [];

// get la page actuelle
let page = window.location.pathname.split('/')[1];
if (page === '') {
    page = 'dashboard';
}

document.querySelector('.neosmentis_logo_titre').addEventListener('click', function() {
    window.location.href = '/';
});

function create_btn_menu(title,img,liste_titre,list_img,liste_url) {
    let btn_menu = document.createElement('div');
    btn_menu.className = 'btn_menu';
    btn_menu.id = title;

    let logo_menu_ind = document.createElement('div');
    logo_menu_ind.className = 'logo_menu_ind';
    btn_menu.appendChild(logo_menu_ind);

    let img_menu_ind = document.createElement('img');
    img_menu_ind.src = img;
    logo_menu_ind.appendChild(img_menu_ind);
    
    let text_menu_ind = document.createElement('div');
    text_menu_ind.className = 'text_menu_ind';
    let p = document.createElement('p');
    p.textContent = title;
    text_menu_ind.appendChild(p);
    btn_menu.appendChild(text_menu_ind);

    if (liste_titre.length === 0) {
        let nothing = document.createElement('div');
        nothing.className = 'nothing';
        nothing.style.display = 'none';
        return [btn_menu,nothing];
    }

    let fleche_indicateur = document.createElement('div');
    fleche_indicateur.className = 'fleche_indicateur';
    fleche_indicateur.textContent = '>';
    btn_menu.appendChild(fleche_indicateur);

    let notif_indicateur = document.createElement('div');
    notif_indicateur.className = 'notif_indicateur';

    btn_menu.appendChild(notif_indicateur);

    let sous_menu_list = document.createElement('div');
    sous_menu_list.className = 'sous_menu_list';

    for (let i = 0; i < liste_titre.length; i++) {
        let sous_menu = document.createElement('div');
        sous_menu.className = 'sous_menu';

        sous_menu.addEventListener('click', function() {
            if (page === liste_url[i].split('/')[1]) {
                return;
            }
            window.location.href = liste_url[i];
        });

        let logo_menu_ind = document.createElement('div');
        logo_menu_ind.className = 'logo_menu_ind';
        let img_menu_ind = document.createElement('img');
        img_menu_ind.src = list_img[i];
        logo_menu_ind.appendChild(img_menu_ind);
        sous_menu.appendChild(logo_menu_ind);

        let text_menu_ind = document.createElement('div');
        text_menu_ind.className = 'text_menu_ind';
        let p = document.createElement('p');
        p.textContent = liste_titre[i];
        // losrqu'on hvoer le texte il y a un effet de soulignement
        
        text_menu_ind.appendChild(p);
        sous_menu.appendChild(text_menu_ind);

        sous_menu_list.appendChild(sous_menu);
    }

    return [btn_menu,sous_menu_list];
}

function active_reactive_btn_menu(btn_menu,sous_menu) {
    btn_menu.addEventListener('click', function() {
        if (sous_menu.style.display === 'flex') {
            sous_menu.style.display = 'none';
            btn_menu.classList.remove('selected');
            if (btn_menu.querySelector('.fleche_indicateur')){
                btn_menu.querySelector('.fleche_indicateur').style.transform = 'rotate(0deg)';
            }
        } else {
            sous_menu.style.display = 'flex';
            btn_menu.classList.add('selected');
            if (btn_menu.querySelector('.fleche_indicateur')){
                btn_menu.querySelector('.fleche_indicateur').style.transform = 'rotate(90deg)';
            }
        }
        all_btn_menu.forEach(function (btn) {
            if (btn !== btn_menu) {
                btn.classList.remove('selected');
                if (btn.querySelector('.fleche_indicateur')){
                    btn.querySelector('.fleche_indicateur').style.transform = 'rotate(0deg)';
                }
            }

        });
        all_sous_menu.forEach(function (sous_menu_) {
            if (sous_menu_ !== sous_menu) {
                sous_menu_.style.display = 'none';
            }
        });
    });
    let sous_menus = sous_menu.querySelectorAll('.sous_menu');
    sous_menus.forEach(function (sous_menu_) {
        sous_menu_.addEventListener('click', function() {
            if (sous_menu_.style.backgroundColor === 'var(--tonic-blue)') {
                sous_menu_.style.backgroundColor = 'transparent';
                return;
            }
            sous_menu_.style.backgroundColor = 'var(--tonic-blue)';
            sous_menus.forEach(function (sous_menu__) {
                if (sous_menu__ !== sous_menu_) {
                    sous_menu__.style.backgroundColor = 'transparent';
                }
            });
        });
    });
}
function inisializeRightMenu() {
    // Dashboard
    let big_menu_parent = document.querySelector('.big_menu_parent');
    let [btn_menu, sous_menu] = create_btn_menu('Dashboard', '/logo/icon/dashboard.svg',[],[],[]);
    big_menu_parent.appendChild(btn_menu);
    big_menu_parent.appendChild(sous_menu);
    all_btn_menu.push(btn_menu);
    all_sous_menu.push(sous_menu);
    active_reactive_btn_menu(btn_menu,sous_menu);
    if (page === 'dashboard') {
        btn_menu.click();
    }

    btn_menu.addEventListener('click', function() {
        if (page !== 'dashboard') {
            window.location.href = '/';
        }

    });


    // Messages
    big_menu_parent = document.querySelector('.big_menu_parent');
    [btn_menu, sous_menu] = create_btn_menu('Messages', '/logo/icon/message.svg',['Principal','Secondaire','Corbeille','Contacts'],['/logo/icon/message_principal.svg','/logo/icon/message_secondaire.svg','/logo/icon/corbeille.svg','/logo/icon/contact.svg'],["/message","/message","/message","/message"]);
    big_menu_parent.appendChild(btn_menu);
    big_menu_parent.appendChild(sous_menu);
    all_btn_menu.push(btn_menu);
    all_sous_menu.push(sous_menu);
    active_reactive_btn_menu(btn_menu,sous_menu);


    // Documents
    if (page === 'document') {
        console.log('document',titre_doc);
        big_menu_parent = document.querySelector('.big_menu_parent');
        [btn_menu, sous_menu] = create_btn_menu('Documents', '/logo/icon/document.svg',[titre_doc,'Tout mes documents','Partagé avec moi','Nouveau','Corbeille'],['/logo/icon/document.svg','/logo/icon/document.svg','/logo/icon/document_partage.svg','/logo/icon/document_nouveau.svg','/logo/icon/corbeille.svg'],["/document","/documents","/documents","/documents","/documents"]);
        big_menu_parent.appendChild(btn_menu);
        big_menu_parent.appendChild(sous_menu);
        all_btn_menu.push(btn_menu);
        all_sous_menu.push(sous_menu);
        active_reactive_btn_menu(btn_menu,sous_menu);
        btn_menu.click();
        sous_menu.firstChild.click();
    }else{
        big_menu_parent = document.querySelector('.big_menu_parent');
        [btn_menu, sous_menu] = create_btn_menu('Documents', '/logo/icon/document.svg',['Tout mes documents','Partagé avec moi','Nouveau','Corbeille'],['/logo/icon/document.svg','/logo/icon/document_partage.svg','/logo/icon/document_nouveau.svg','/logo/icon/corbeille.svg'],["/documents","/documents","/documents","/documents"]);
        big_menu_parent.appendChild(btn_menu);
        big_menu_parent.appendChild(sous_menu);
        all_btn_menu.push(btn_menu);
        all_sous_menu.push(sous_menu);
        active_reactive_btn_menu(btn_menu,sous_menu);

        if (page === 'documents') {
            btn_menu.click();
            sous_menu.firstChild.click();
        }
    }


}

function changeNotifNumber(number) {
    let div_notif_event = document.querySelector('.div_notif_event');

    div_notif_event.style.display = 'none';

    if (number > 0) {
        div_notif_event.style.display = 'flex';
    }
    div_notif_event.innerText = number;
}

function changeStatut(text){
    let statut = document.querySelector('#statut');
    if (text === 'En ligne') {
        statut.classList.add('online');
    }
    if (text === 'Hors ligne') {
        statut.classList.add('offline');
    }
    statut.innerText = text;
}

function changeNotifBar(text,titre="Nouvelle notification") {
    let svg_notif = document.querySelector('#notif');
    let svg_attention = document.querySelector('#attention');
    let svg_empty = document.querySelector('#clean');

    let tete = document.querySelector('#tete');
    let corps = document.querySelector('#body');

    if (text === ''){
        svg_notif.style.opacity = '0';
        svg_attention.style.opacity = '0';
        svg_empty.style.opacity = '1';

        tete.innerText = "Rien pour l'instant";
        corps.innerText = "Aucune notification pour l'instant";
    }
    else{
        svg_notif.style.opacity = '1';
        svg_attention.style.opacity = '1';
        svg_empty.style.opacity = '0';

        tete.innerText = titre;
        corps.innerText = text;
    }
    
}

function changeNotifNumberToMenu(number,menu) {
    let div_notif_event = document.querySelector('#'+menu+' .notif_indicateur');
    div_notif_event.style.display = 'none';
    if (number > 0) {
        div_notif_event.style.display = 'flex';
    }
    div_notif_event.innerText = number;
}

if (page == "dashboard" || page == "documents") {

    inisializeRightMenu();
}
