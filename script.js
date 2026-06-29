// ===============================

// AI RECORD PRESERVER

// ===============================



let records = [];



// ===============================

// BUTTON EVENTS

// ===============================



document.getElementById("uploadBtn").addEventListener("click", uploadRecord);

document.getElementById("searchBtn").addEventListener("click", searchRecords);

document.getElementById("sendChat").addEventListener("click", sendMessage);

// Browse button

document.getElementById("browseBtn").addEventListener("click", function () {
    document.getElementById("fileInput").click();
});



document.getElementById("chatInput").addEventListener("keypress", function(e){

    if(e.key === "Enter"){

        sendMessage();

    }

});



// ===============================

// UPLOAD RECORD

// ===============================



function uploadRecord(){



    const title = document.getElementById("recordTitle").value.trim();

    const file = document.getElementById("fileInput").files[0];

    const reader = new FileReader();


    if(title === ""){

        alert("Please enter a record title.");

        return;

    }



    if(!file){

        alert("Please choose a file.");

        return;

    }



const record = {

    id: Date.now(),

    title: title,

    fileName: file.name,

    fileType: file.type || "Unknown",

    fileSize: (file.size / 1024).toFixed(2) + " KB",

    uploadDate: new Date().toLocaleString(),

    content: "",

    summary: "",

    keywords: [],

    category: "Unknown",

    sentiment: "Unknown"

};

reader.onload = async function () {

    await showAIProcessing();


    try {

    const aiResult = await analyzeWithAI(file);
    record.content = aiResult.text;
    record.summary = aiResult.summary;
    record.category = aiResult.category;
    record.keywords = aiResult.keywords;
    record.sentiment = aiResult.sentiment;

} catch (error) {

    console.error(error);

    if (error.message.includes("503")) {
        record.summary = "⚠ AI is busy. Please try again in a few seconds.";
    } else {
        record.summary = error.message;
    }

    record.category = "Unknown";
    record.keywords = [];
    record.sentiment = "Unknown";

} finally {

    hideAIProcessing();

}

records.unshift(record);

    saveRecords();

    if (db) {
        saveRecord(record);
    }

    displayRecords();

    document.getElementById("recordTitle").value = "";
    document.getElementById("fileInput").value = "";

    alert("Record Uploaded Successfully!");

}; // reader.onload ends here

reader.readAsArrayBuffer(file);

} // uploadRecord ends here

// ===============================
// SAVE
// ===============================

function saveRecords() {

    updateStatistics();

}



// ===============================

// DISPLAY RECORDS

// ===============================



function displayRecords(list = records){



    const container = document.getElementById("recordList");



    container.innerHTML = "";



    if(list.length === 0){



        container.innerHTML = "<p>No Records Found.</p>";



        return;



    }



    list.forEach(function(record){



        const card = document.createElement("div");



        card.className = "record-card";



        card.innerHTML = `



            <h3>${record.title}</h3>



            <p><strong>File:</strong> ${record.fileName}</p>



            <p><strong>Type:</strong> ${record.fileType}</p>



            <p><strong>Size:</strong> ${record.fileSize}</p>



            <p><strong>Uploaded:</strong> ${record.uploadDate}</p>



            <p><strong>Summary:</strong> ${record.summary}</p>

            <p><strong>Category:</strong> ${record.category}</p>

            <p><strong>Keywords:</strong> ${record.keywords.join(", ")}</p>

            <p><strong>Sentiment:</strong> ${record.sentiment}</p>



            <button class="delete-btn" onclick="deleteRecord(${record.id})">



                Delete



            </button>



        `;



        container.appendChild(card);



    });



}



// ===============================

// DELETE

// ===============================



function deleteRecord(id){


    records = records.filter(function(record){

 
       return record.id !== id;


    });

 
   deleteRecordFromDB(id);

 
   displayRecords();


}



// ===============================

// SEARCH

// ===============================



function searchRecords(){



    const query = document

        .getElementById("searchInput")

        .value

        .toLowerCase()

        .trim();



    if(query === ""){



        displayRecords();



        return;



    }



    const filtered = records.filter(function(record){



        return (



            record.title.toLowerCase().includes(query) ||



            record.fileName.toLowerCase().includes(query) ||



            record.fileType.toLowerCase().includes(query)



        );



    });



    displayRecords(filtered);



}



// ===============================

// AI CHAT

// ===============================



async function sendMessage(){

    const input=document.getElementById("chatInput");

    const question=input.value.trim();

    if(question==="") return;

    addMessage("You",question);

    input.value="";

    if(records.length===0){

        addMessage("AI","Your vault is empty. Upload a document first.");

        return;

    }

    addMessage("AI","🧠 Thinking...");

    try{

        let allDocuments="";

        records.forEach(record=>{

            if(record.content){

                allDocuments+=
                "\n\nDOCUMENT: "+record.title+
                "\n"+record.content;

            }

        });

        const response = await fetch("/api/chat", {

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body: JSON.stringify({

    mode: "chat",

    text:
        allDocuments +
        "\n\nQuestion:\n" +
        question

})

        });

        const data=await response.json();

        document.querySelector("#chatMessages .message:last-child").remove();

        addMessage("AI",data.summary);

    }

    catch(err){

        document.querySelector("#chatMessages .message:last-child").remove();

        addMessage("AI","Sorry, I couldn't answer that.");

    }

}



// ===============================

// ADD CHAT MESSAGE

// ===============================



function addMessage(sender,text){



    const chat = document.getElementById("chatMessages");



    const div = document.createElement("div");



    div.className = "message";



    div.innerHTML = "<strong>" + sender + ":</strong> " + text;



    chat.appendChild(div);



    chat.scrollTop = chat.scrollHeight;



}

async function analyzeWithAI(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append("mode", "analyze");

    const response = await fetch("/api/analyze", {

        method: "POST",

        body: formData

    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(data.error || "AI Analysis Failed");

    }

    const aiResult = JSON.parse(data.summary);
aiResult.text = data.text;
return aiResult;

}


function updateStatistics(){

    const recordCount=document.getElementById("recordCount");

    const analysisCount=document.getElementById("analysisCount");

    const storageCount=document.getElementById("storageCount");

    if(!recordCount) return;

    let totalStorage=0;

    records.forEach(record=>{

        const size=parseFloat(record.fileSize);

        if(!isNaN(size)){

            totalStorage+=size;

        }

    });

    animateCounter(recordCount,records.length);

    animateCounter(analysisCount,records.length);

    storageCount.textContent=totalStorage.toFixed(1)+" KB";

}

function animateCounter(element,target){

    let start=0;

    const duration=600;

    const increment=Math.max(1,Math.ceil(target/30));

    const timer=setInterval(()=>{

        start+=increment;

        if(start>=target){

            start=target;

            clearInterval(timer);

        }

        element.textContent=start;

    },duration/30);

}

// ===============================
// AI PROCESSING ANIMATION
// ===============================

async function showAIProcessing(){

const overlay=document.getElementById("aiOverlay");

const percent=document.getElementById("progressPercent");

const fill=document.getElementById("progressFill");

const status=document.getElementById("processingStatus");

overlay.style.display="flex";

const stages=[

["Reading File...",10],

["Extracting Text...",25],

["Building AI Context...",40],

["Finding Keywords...",60],

["Analyzing Sentiment...",75],

["Generating Summary...",90],

["Saving To Vault...",100]

];

for(const stage of stages){

status.textContent=stage[0];

let current=parseInt(percent.innerText);

while(current<stage[1]){

current++;

percent.innerText=current+"%";

fill.style.width=current+"%";

await new Promise(r=>setTimeout(r,20));

}

}

}

function hideAIProcessing(){

document.getElementById("aiOverlay").style.display="none";

}