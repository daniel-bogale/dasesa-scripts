const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./dasesa-private-key.json")),
  databaseURL: "https://<your-database-name>.firebaseio.com",
});

const db = admin.firestore();

// Define the path to your CSV file
const csvFilePath = "./ReprenstativeSampleGroups.csv";

// Function to read CSV and upload to Firestore
function uploadCsvToFirestore() {
  const representativeGroups = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      // Construct the document ID and data
      const docId = `g_${row.group}`;
      const docData = {
        group: docId,
        ethnicity: row.ethnicity,
        gender: row.gender,
        minAge: parseInt(row.minAge, 10),
        maxAge: parseInt(row.maxAge, 10),
        proportion: parseInt(row.proportion),
        percentageProportion: parseFloat(row.percentageProportion),
      };

      representativeGroups.push({ id: docId, data: docData });
    })
    .on("end", () => {
      console.log("CSV file successfully processed. Uploading to Firestore...");
      uploadToFirestore(representativeGroups);
    });
}

// Function to upload data to Firestore
async function uploadToFirestore(groups) {
  const batch = db.batch();

  groups.forEach((group) => {
    const docRef = db.collection("representativeGroups").doc(group.id);
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
