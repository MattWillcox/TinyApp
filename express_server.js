const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
const PORT = process.env.PORT || 8080; // default port 8080

//current Database of URLS
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Generates the shortURL string, 6 chars of alphanumerics
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

//index page that just displays Hello!
app.get("/", (req, res) => {
  res.end("Hello!");
});

//displays the current urlDatabase in JSON on page
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//renders /urls page with urls_index.ejs
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//renders /urls/new page with urls_new.ejs
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//renders /urls/:id page (:id = shortURL) with urls_show.ejs
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

//redirects client to the longURL version of provided short URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//generates a new shortURL for specified longURL and redirects to the shortURL page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = `http://www.${req.body.longURL}`;
  res.redirect(`/urls/${shortURL}`);
});

//listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});