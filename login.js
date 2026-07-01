import { auth, provider } from "./firebase.js";

import {

    signInWithPopup,

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const loginButton = document.getElementById("googleLogin");

loginButton.addEventListener("click", async () => {

    try {

        await signInWithPopup(auth, provider);

    }

    catch (err) {

    if (err.code === "auth/popup-closed-by-user") {
        return;
    }

    alert(err.message);

}

});

onAuthStateChanged(auth, (user)=>{

    if(user){

        window.location.href = "dashboard.html";

    }

});
