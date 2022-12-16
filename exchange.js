process.stdin.setEncoding("utf8");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });

const http= require("http");
const express= require("express");
const ejs= require("ejs");
const app= express();
const bodyParser= require("body-parser");
const fs= require("fs");

const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

let recipient="jgallag8@terpmail.umd.edu";
let human= "";


const databaseAndCollection = {db: "CMSC335DB", collection:"SecretSantaCollection"};

const { MongoClient, ServerApiVersion } = require('mongodb');
const { table } = require("console");

const uri = `mongodb+srv://Jgallag8:AUOMN79qeIXS8Avq@cluster0.ftecp3g.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const axios = require("axios");

const options = {
  method: 'POST',
  url: 'https://rapidprod-sendgrid-v1.p.rapidapi.com/mail/send',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'f7387473d0mshc952ad9bb54468ep1b532djsnbf9812660035',
    'X-RapidAPI-Host': 'rapidprod-sendgrid-v1.p.rapidapi.com'
  }};

async function insertParticipant(gifter) {
    
    await client.connect;
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(gifter);
    await client.close;

}

async function deleteAll() {
    await client.connect();
    const result = await client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({});
    return result.deletedCount;
}

async function getParticipants() {
    await client.connect;
    let filter= {};

    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    const result = await cursor.toArray();

    return result;

}

process.stdin.on("readable", function () {

    let input= process.stdin.read();
    if (input !== null) {

        let word= input.trim();
       
        if (word === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        }
    }
});



app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.set('views', __dirname + '\\templates');

app.get("/", (request, response) => {
    response.render("index.ejs");
});

app.post("/entry", (request, response) => {
    response.render("entry.ejs");
});

app.post("/confirmed", async (request, response) => {

    name= request.body.name;
    email= request.body.email;

    let person= {"name":name, "email":email, "order":Math.floor(Math.random() * 20)};

    await insertParticipant(person);

    response.render("confirmed.ejs");

});

app.post("/removed", async (request, response) => {
    num= await deleteAll();

    response.render("removed.ejs");

});

app.post("/send", async (request, response) => {

    players= await getParticipants();
    players.sort((a, b) => {
        return a.order - b.order;
    });

    givers= "<table border=2><tr><th>Giver</th><th>Recipient</th></tr>";

    for (let c=0; c < players.length - 1; c++) {
        givers+= "<tr><td>" + players[c].name + "</td>";
        givers+= "<td class=\"hidden\">" + players[c+1].name + "</td></tr>"

        recipient= players[c].email;
        human= players[c+1].name;

        options.data= {"personalizations":[{"to":[{"email":recipient}],"subject":"Secret Santa"}],"from":{"email":"from_address@example.com"},"content":[{"type":"text/plain","value":`You are gifting to ${human}`}]};

        axios.request(options);
    }

    givers+= "<tr><td>" + players[players.length - 1].name + "</td><td class= \"hidden\">" + players[0].name + "</td></tr></table>";

    recipient= players[players.length - 1].email;
    human= players[0].name;

    options.data= {"personalizations":[{"to":[{"email":recipient}],"subject":"Secret Santa"}],"from":{"email":"from_address@example.com"},"content":[{"type":"text/plain","value":`You are gifting to ${human}`}]};

    axios.request(options);

    response.render("send.ejs");

});


app.listen(5000);
console.log(`Web server started and running at http://localhost:5000
Type stop to shutdown the server: `
);