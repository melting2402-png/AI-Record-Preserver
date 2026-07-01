let db;

const request = indexedDB.open("AIRecordVault", 1);

request.onupgradeneeded = function(event) {

    db = event.target.result;

    db.createObjectStore("records", {
        keyPath: "id"
    });

};

request.onsuccess = function(event) {

    db = event.target.result;

    console.log("Database Ready!");

    if (typeof displayRecords === "function") {
        loadRecords();
    }

};

request.onerror = function() {

    console.log("Database Error");

};
function saveRecord(record) {

    const transaction = db.transaction(["records"], "readwrite");

    const store = transaction.objectStore("records");

    const request = store.add(record);

    request.onsuccess = function() {
        console.log("Record Saved!");
    };

    request.onerror = function() {
        console.log("Error saving record.");
    };

}

function loadRecords() {

    const transaction = db.transaction(["records"], "readonly");

    const store = transaction.objectStore("records");

    const request = store.getAll();

    request.onsuccess = function () {

    records = request.result;

    console.log("Records loaded:", records);
    console.log("Length:", records.length);

    displayRecords();

    updateStatistics();

};

}

function deleteRecordFromDB(id) {

    const transaction = db.transaction(["records"], "readwrite");

    const store = transaction.objectStore("records");

    const request = store.delete(id);

    request.onsuccess = function() {

        console.log("Record Deleted!");

    };

}
