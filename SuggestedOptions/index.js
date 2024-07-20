const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

admin.initializeApp({
  credential: admin.credential.cert(require("./dasesa-private-key.json")),
  databaseURL: "https://<your-database-name>.firebaseio.com",
});

const db = admin.firestore();

const csvFilePath = "./SuggestedOptions.csv";

function uploadCsvToFirestore() {
  const suggestedOptions = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      const docId = `${row.title}`;
      const options = row.options.split("__");
      const docData = {
        title: row.title,
        index: +row.no,
        options,
      };

      suggestedOptions.push({ id: docId, data: docData });
    })
    .on("end", () => {
      console.log("CSV file successfully processed. Uploading to Firestore...");
      uploadToFirestore(suggestedOptions);
    });
}

// Function to upload data to Firestore
async function uploadToFirestore(groups) {
  const batch = db.batch();

  groups.forEach((group) => {
    const docRef = db.collection("SuggestedOptions").doc(group.id);
    batch.set(docRef, group.data);
  });

  try {
    await batch.commit();
    console.log("Data successfully uploaded to Firestore.");
  } catch (error) {
    console.error("Error uploading data to Firestore:", error);
  }
}

// Execute the upload function
uploadCsvToFirestore();
