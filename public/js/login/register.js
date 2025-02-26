
let section_right = document.querySelector(".right_section");
    
let passwordInput = section_right.querySelector("#password");
let passwordComplexity = section_right.querySelector(".password_complexity p");
let passwordStrength = section_right.querySelectorAll(".password_complexity .div_strong");
let register = section_right.querySelector(".register");

function evaluerComplexite(mdp) {
    let score = 0, commentaire = [];

    let longueur = mdp.length >= 8, longPlus = mdp.length >= 12;
    let minuscule = /[a-z]/.test(mdp), majuscule = /[A-Z]/.test(mdp);
    let chiffre = /\d/.test(mdp), special = /[^a-zA-Z\d]/.test(mdp);

    if (longueur) score++;
    if (longPlus) score += 2;
    if (minuscule) score++;
    if (majuscule) score+= 1.5;
    if (chiffre) score+= 1.5;
    if (special) score += 2;

    if (!special) { score = Math.min(score, 3); commentaire.push("Ajoutez un caractère spécial."); }
    if (!majuscule) commentaire.push("Ajoutez une majuscule.");
    if (!chiffre) commentaire.push("Ajoutez un chiffre.");
    if (!longueur) commentaire.push("Trop court, min. 8 caractères.");
    else if (!longPlus) commentaire.push("Préférez 12+ caractères.");
    score = Math.ceil(score);
    let niveaux = ["<b>Très faible</b>,", "<b>Faible</b>,", "<b>Moyen</b>, ", "<b>Moyen</b>,  ", "<b>Bon</b>, ", "<b>Bon</b>, ", "<b>Fort</b>, ", "<b>Fort</b>. ", "<b>Très fort</b>.", "<b>Parfait</b>."];
    let score_ = Math.ceil(score / 2);
    return { score_, message: niveaux[score] + " " + commentaire.join(" ") };
}

passwordInput.addEventListener("input", function () {
    let password = passwordInput.value;
    if (password.length === 0) {
        passwordComplexity.textContent = "";
        passwordStrength.forEach(element => {
            element.classList.remove("strong");
        });
        return;
    }

    let score = evaluerComplexite(password);
    passwordStrength.forEach((element, index) => {
        if (index < score.score_) {
            element.classList.add("strong");
        } else {
            element.classList.remove("strong");
        }
    });


    if (score.score_ >= 4) {
        submitButton.classList.add("ok");
    } else {
        submitButton.classList.remove("ok");
    }

    passwordComplexity.style.color = "var(--background-color)";
    passwordComplexity.innerHTML = score.message;
});
function verifierEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

async function verif_email_base(email) {
    let response = await fetch("/auth/verify_email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    let data = await response.json();
    return data.success;
}

async function registerUser(email,password,username){

    let response = await fetch("/auth/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            username: username,
            password: password,
            email: email
        })
    });

    let data = await response.json();
    if (data.success) {
        window.location.href = "/";
    } else {
        document.querySelector(".password_complexity p").textContent = data.error;
        document.querySelector(".password_complexity p").style.color = "var(--contrast-red)";
    }
    
}

register.addEventListener("click", function () {
    let password = passwordInput.value;
    let username = section_right.querySelector("#username").value;
    let email = section_right.querySelector("#email").value;

    let score = evaluerComplexite(password);
    if (score.score_ < 4) {
        passwordComplexity.textContent = "Le mot de passe n'est pas assez fort.";
        passwordComplexity.style.color = "var(--contrast-red)";
        return;
    }

    // verifier l'email
    verifierEmail(email) ? passwordComplexity.textContent = "" : passwordComplexity.textContent = "L'email n'est pas valide.";
    if (!verifierEmail(email)) {
        passwordComplexity.style.color = "var(--contrast-red)";
        return;
    }

    verif_email_base(email).then((success) => {
        if (!success) {
            passwordComplexity.textContent = "L'email est déjà utilisé.";
            passwordComplexity.style.color = "var(--contrast-red)";
            return;
        }
    });

    if (username.length <= 4) {
        passwordComplexity.textContent = "Le nom d'utilisateur est trop court au moins 5 caractères.";
        passwordComplexity.style.color = "var(--contrast-red)";
        return;
    }

    registerUser(email,password,username);
});
