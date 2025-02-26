let div_messages_main = document.querySelector('.div_messages_main');
let all_messages = document.querySelectorAll('.div_message');


let actual_offset_messages = 0;

document.addEventListener('wheel', function(e) {
    if (e.target.closest('.div_messages_main') && all_messages.length > 3) {
        console.log('scroll');
        if (e.deltaY > 0) {
            if (actual_offset_messages + 100 >= (all_messages.length - 1) * 100) {
                return;
            }
            for (let i = 0; i < all_messages.length; i++) {
                all_messages[i].style.transform = `translateY(-${actual_offset_messages + 100}%)`;
            }
            actual_offset_messages += 100;
        } else {
            if (actual_offset_messages === 0) {
                return;
            }
            for (let i = 0; i < all_messages.length; i++) {
                all_messages[i].style.transform = `translateY(-${actual_offset_messages - 100}%)`;
            }
            actual_offset_messages -= 100;
        }
    }
});

function add_message (img,titre,content,id_conv){
    const messageContainer = document.createElement('div');
    messageContainer.className = 'div_message';
    messageContainer.dataset.id_conv = id_conv;

    messageContainer.addEventListener('click', function() {
        window.location.href = `/message/${id_conv}`;
    });

    const imgProfil = document.createElement('div');
    imgProfil.className = 'img_profil';
    const imgElement = document.createElement('img');
    imgElement.src = img;
    imgProfil.appendChild(imgElement);

    const textMessage = document.createElement('div');
    textMessage.className = 'text_message';
    const titleElement = document.createElement('h4');
    titleElement.textContent = titre;
    const contentElement = document.createElement('p');
    contentElement.textContent = content;
    textMessage.appendChild(titleElement);
    textMessage.appendChild(contentElement);

    const timeElement = document.createElement('p');
    timeElement.className = 'time';
    timeElement.innerHTML = 'Il y a <b>5min</b>';

    messageContainer.appendChild(imgProfil);
    messageContainer.appendChild(textMessage);
    messageContainer.appendChild(timeElement);

    div_messages_main.appendChild(messageContainer);
    all_messages = document.querySelectorAll('.div_message');
    return messageContainer;
}

async function get_messages(){
    fetch('/message/get_all')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success == false || data.error == "Non autorisé"){
            window.location.href = "/login";
            return;
        }
        for (let i = 0; i < data.data.length; i++) {
            add_message(data.data[i].img,data.data[i].titre,data.data[i].content,data.data[i].id_conv);
        }
    });
}
add_message('https://www.w3schools.com/howto/img_avatar.png','Titre','Contenu','1');
get_messages();