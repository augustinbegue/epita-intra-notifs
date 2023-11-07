// ==UserScript==
// @name         Epita Intra NOTIFS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://intra.forge.epita.fr/epita-ing-assistants-acu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=epita.fr
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';


    let listHeader = document.querySelector("body > main > div.body > div > div:nth-child(2) > div:nth-child(5)");

    if (!listHeader || !listHeader.innerText.includes("Tags")) {
        console.error("no header found. exiting.");
        return;
    }

    let button = document.createElement("button");
    button.innerText = "Watch";
    button.onclick = () => {
        watch();
    };

    let status = getStatus();

    if (status) {
        button.style.backgroundColor = "green";
        button.innerHTML = "Watching";
        watch(true);
    }

    listHeader.appendChild(button);
})();

function getStatus() {
    let store = localStorage.getItem("notifsstatus");
    if (!store)
        store = "{}";

    let jsonStore = JSON.parse(store);
    let pathname = normalize(window.location.pathname);

    if (!jsonStore) {
        return false;
    }

    return jsonStore[pathname];
}

function normalize(pathname) {
    if (!pathname.endsWith("/"))
        pathname += "/";

    return pathname;
}

function setStatus(status) {
    let store = localStorage.getItem("notifsstatus");
    if (!store)
        store = "{}";

    let jsonStore = JSON.parse(store);
    let pathname = normalize(window.location.pathname);

    if (!jsonStore) {
        jsonStore = {};
    }

    jsonStore[pathname] = status;

    localStorage.setItem("notifsstatus", JSON.stringify(jsonStore));
}

function setProcessed(tagName) {
    let store = localStorage.getItem("notifsprocessed");
    if (!store)
        store = "{}";

    let jsonStore = JSON.parse(store);
    let pathname = normalize(window.location.pathname);

    if (!jsonStore) {
        jsonStore = {};
    }

    if (!jsonStore[pathname]) {
        jsonStore[pathname] = [];
    }

    jsonStore[pathname].push(tagName);

    localStorage.setItem("notifsprocessed", JSON.stringify(jsonStore));
}

function isProcessed(tagName) {
    let store = localStorage.getItem("notifsprocessed");
    if (!store)
        store = "{}";

    let jsonStore = JSON.parse(store);
    let pathname = normalize(window.location.pathname);

    if (!jsonStore || !jsonStore[pathname]) {
        return false;
    }

    return jsonStore[pathname].includes(tagName);
}

function watch(resume = false) {
    let status = getStatus();

    if (status && !resume) {
        setStatus(false);
        window.location.reload();
        return;
    }

    if (!status && !resume) {
        setStatus(true);
        window.location.reload();
    }

    let list = document.querySelector("body > main > div.body > div > div:nth-child(2) > div.list");
    let name = document.querySelector("body > main > header > h1")?.innerText;
    if (!list) {
        console.error("no tags found. exiting.");
        return;
    }

    let tagsArr = Array.from(list.children);

    if (tagsArr.length === 0) {
        console.error("no tags found. exiting.");
        return;
    }
    let found = false;
    for (let i = 0; i < tagsArr.length; i++) {
        let tag = tagsArr[i];

        if (tag.attributes.href.value.startsWith("/") && !tag.classList.contains('list__item__disabled')) {
            let tagName = tag.querySelector(".list__item__name").innerText;

            if (!isProcessed(tagName)) {
                let percent = tag.querySelector("trace-symbol").attributes.successpercent.value ?? 100;

                GM_notification(
                    {
                        text: `Processed tag on ${name}: ${tagName} (${percent}%)`,
                    }
                );
                found = true;
                setProcessed(tagName);

                setStatus(false);

                break;
            }

        }
    }

    if (!found) {
        console.error("no completed tag found. refreshing in 30s.");
        setTimeout(() => {
            window.location.reload();
        }, 30000);
        return;
    }
}
