function togglePassword(cote) {
    if (cote == 1){
        let left_section = document.querySelector(".left_section");
        let passwordInput = left_section.querySelector("#password");
        let passwordButton = left_section.querySelector(".toggle-password img");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordButton.src = "/logo/icon/oeil_hide.svg";
        } else {
            passwordInput.type = "password";
            passwordButton.src = "/logo/icon/oeil_show.svg";
        }
    }else{
        let right_section = document.querySelector(".right_section");
        let passwordInput = right_section.querySelector("#password");
        let passwordButton = right_section.querySelector(".toggle-password img");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordButton.src = "/logo/icon/oeil_hide.svg";
        } else {
            passwordInput.type = "password";
            passwordButton.src = "/logo/icon/oeil_show.svg";
        }
    }
}

let submitButton = document.querySelector(".login");
submitButton.addEventListener("click", function () {
    let password = document.getElementById("password").value;
    let username = document.getElementById("username").value;

    login(password, username);
});


async function login(password , username) {
    let response = await fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    let data = await response.json();
    if (data.success) {
        window.location.href = "/";
    } else {
        document.querySelector(".password_complexity p").textContent = data.error;
        document.querySelector(".password_complexity p").style.color = "var(--contrast-red)";
    }
}
