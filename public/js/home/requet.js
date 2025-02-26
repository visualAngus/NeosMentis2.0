let csrfToken;
try {
    const metaElement = document.querySelector('meta[name="csrf-token"]');
    csrfToken = metaElement ? metaElement.getAttribute('content') : null;
    console.log('CSRF Token:', csrfToken);
} catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    csrfToken = null;
}

function get_user_info(){
    fetch('/user/get_info')
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        if (data.success == false || data.error == "Non autorisé"){
            window.location.href = "/login";
            return;
        }
        username = data.data.username;
        setTimeout(() => {
            sendMessage("login", data.data.id_user);
        }, 500);

        document.getElementById('salutation').innerHTML = "Salut, "+username;
    });
}

get_user_info();


// function login (){
//     let username = "admin";
//     let password = "azerty";
//     let data = {username:username,password:password};
//     fetch('/auth/login', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data)
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//     });
// }
// login();