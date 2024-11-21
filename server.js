const express = require("express"); 
const path = require ('path');

const app = express();
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

app.use(express.static(path.join(__dirname)));

app.listen(PORT, (error) => {
  error
    ? console.log(error)
    : console.log(`Client running on ${BASE_URL}`);
});

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.use((req, res) => {
  res.redirect(BASE_URL);
});