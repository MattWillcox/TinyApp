const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const PORT = process.env.PORT || 8080; // default port 8080

//current Database of URLS
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

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
  let templateVars = { urls: urlDatabase, user_id: req.cookies["user_id"] };
  res.render("urls_index", templateVars);
});

//renders /urls/new page with urls_new.ejs
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["user_id"] }
  res.render("urls_new", templateVars);
});

//renders /urls/:id page (:id = shortURL) with urls_show.ejs
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["user_id"]};
  res.render("urls_show", templateVars);
});

//redirects client to the longURL version of provided short URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { users };
  res.render("urls_register", templateVars);
});

//generates a new shortURL for specified longURL and redirects to the shortURL page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = `http://www.${req.body.longURL}`;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = `http://www.${req.body.longURL}`;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  res.cookie('user_id', `${req.body.loginName}`);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  if((req.body.email).length === 0 || (req.body.password).length === 0){
    res.status(400).send('Please enter an email and a password');
  }

  for(var user in users){
    if(users[user].email === req.body.email){
      res.status(400).send('Email is already registered');
    }
  }

  if(res.statusCode !== 400){
    let newUser = {}
    newUser.id = generateRandomString();
    newUser.email = req.body.email;
    newUser.password = req.body.password;

    users[`${newUser.id}`] = newUser;
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  }
});

//listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});