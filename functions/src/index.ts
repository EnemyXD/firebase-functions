import * as functions from "firebase-functions";
import express = require("express");
import admin = require("firebase-admin");

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.moderatorRD = functions.database
    .ref("/bookRepository/{bookID}")
    .onWrite((change) => {
      const book = change.after.val();

      if (book && !book.description) {
        return change.after.ref.update({
          author: book.author,
          description: "Coming soon...",
          title: book.title,
        });
      }
      return null;
    });

exports.moderatorFS = functions.firestore
    .document("/bookRepository/{bookID}")
    .onWrite((change) => {
      const book = change.after.data();

      if (book && !book.description) {
        return change.after.ref.update({
          author: book.author,
          description: "Coming soon...",
          title: book.title,
        });
      }
      return null;
    });

const app = express();

admin.initializeApp(functions.config().firebase);

const RD = admin.database();
const FS = admin.firestore();

app.post("/FS-create", async (req, res) => {
  const {author, description, title} = req.body;
  const book = await FS.collection("bookRepository").add({
    author,
    description,
    title,
  });
  return res.json({id: book.id});
});
app.get("/FS-all", async (req, res) => {
  const books = await FS.collection("bookRepository").get();
  const bookRes: { id: string; data: FirebaseFirestore.DocumentData }[] = [];
  books.forEach((doc) => {
    const book = {
      id: doc.id,
      data: doc.data(),
    };
    bookRes.push(book);
  });
  res.json(bookRes);
});
app.get("FS-id", async (req, res) => {
  const {id} = req.body;
  const book = await FS.collection("bookRepository").doc(id).get();
  res.json({data: book.data()});
});
app.put("FS-update", async (req, res) => {
  const {id, title, author, description} = req.body;
  const book = await FS.collection("bookRepository").doc(id);
  const updatedBook = await book.update({author, description, title});
  res.json(updatedBook);
});
app.delete("FS-delete", async (req, res) => {
  const {id} = req.body;
  const book = await FS.collection("bookRepository").doc(id).delete();
  res.json(book);
});
app.post("RD-create", async (req, res) => {
  const {title, author, description} = req.body;
  const book = await RD.ref("bookRepository").push({
    title,
    author,
    description,
  });
  res.json(book);
});
app.get("RD-all", async (req, res) => {
  const books = await RD.ref("bookRepository").once("value");
  res.json(books);
});
app.get("RD-id", async (req, res) => {
  const {id} = req.body;
  const book = await RD.ref("bookRespository").child(id).once("value");
  res.json(book);
});
app.put("RD-update", async (req, res) => {
  const {id, title, author, description} = req.body;
  const book = await RD.ref("bookRepository")
      .child(id)
      .update({title, author, description});
  res.json(book);
});
app.delete("RD-delete", async (req, res) => {
  const {id} = req.body;
  const book = await RD.ref("bookRepository").child(id).remove();
  res.json(book);
});

exports.widgets = functions.https.onRequest(app);
