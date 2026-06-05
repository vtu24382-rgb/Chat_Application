const api = "/api/messages";

function loadMessages() {
    fetch(api)
        .then(res => res.json())
        .then(data => {
            const box = document.getElementById("messages");
            box.innerHTML = "";
            data.forEach(m => {
                box.innerHTML += `<p><b>${m.sender}:</b> ${m.content}</p>`;
            });
        });
}

function sendMessage() {
    const sender = document.getElementById("sender").value;
    const content = document.getElementById("content").value;

    fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, content })
    }).then(() => {
        document.getElementById("content").value = "";
        loadMessages();
    });
}

loadMessages();
setInterval(loadMessages, 2000);
