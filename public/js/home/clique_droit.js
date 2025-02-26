function showContextMenu(event) {
    event.preventDefault();

    // suppression du menu contextuel précédent
    const previousContextMenus = document.querySelectorAll(".clique");
    previousContextMenus.forEach((menu) => {
        menu.remove();
    });

    const contextMenu = document.createElement("div");
    contextMenu.classList.add("clique");
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;

    const menuItem1 = document.createElement("div");
    menuItem1.classList.add("clique-item");
    menuItem1.classList.add("delete");
    menuItem1.setAttribute("state", "false");
    menuItem1.textContent = "Supprimer";

    menuItem1.addEventListener("click", () => {
        if (menuItem1.getAttribute("state") === "false") {
            let width = menuItem1.offsetWidth;
            menuItem1.style.width = `${width}px`;
            menuItem1.textContent = "Confirmer";
            menuItem1.setAttribute("state", "true");
        } else {
            let id = event.target.closest(".div_document").id;
            delete_document(id);
            contextMenu.remove();
        }
    });
    
    const menuItem2 = document.createElement("div");
    menuItem2.classList.add("clique-item");
    menuItem2.textContent = "Ouvir";
    contextMenu.appendChild(menuItem2);
    contextMenu.appendChild(menuItem1);





    document.body.appendChild(contextMenu);
}



document.addEventListener("contextmenu", (event) => {
    showContextMenu(event);
});