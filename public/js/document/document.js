let titre_doc="";
let last_save = Date.now();

function getDoc() {
    // get doc
    fetch("/document/get/" + doc)
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
    
    fetch("/document/update/" + doc, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, content })
    })
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