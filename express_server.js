const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


// default port 8080
const PORT = process.env.PORT || 8080;

//current Database of URLS
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userId : "test"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userId: "test2"
  }
};

//current DB of users
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
};

//Generates the shortURL string, 6 chars of alphanumerics
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

app.use((req, res, next) => {
  res.locals.user = req.cookies.userId;
  next();
});

/*------------------------
  GET REQUESTS
-------------------------*/

//index page that just displays Hello!
app.get("/", (req, res) => {
  res.redirect('/urls');
});

function urlsForUser(id){
  let subsetDB = {};
  for(let i in urlDatabase){
    if(urlDatabase[i].userId === id){
      subsetDB[i] = urlDatabase[i];
    }
  }
  return subsetDB;
}

//renders /urls page with urls_index.ejs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(res.locals.user),
    userId: users[res.locals.user],
    signedIn: res.locals.user
  };
  res.render("urls_index", templateVars);
});

//renders /urls/new page with urls_new.ejs
app.get("/urls/new", (req, res) => {
  if(res.locals.user){
    const templateVars = {
      userId: users[res.locals.user],
      signedIn: res.locals.user
    };
    res.render("urls_new", templateVars);
  }
  else
    res.redirect('/login');
});

//renders /urls/:id page (:id = shortURL) with urls_show.ejs
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    userId: users[res.locals.user],
    signedIn: res.locals.user
  };
  if(res.locals.user === urlDatabase[req.params.id].userId){
    res.render("urls_show", templateVars);
  }
});

//redirects client to the longURL version of provided short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

//renders /register page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//renders /login page
app.get("/login", (req, res) => {
  res.render("urls_login");
});


/*------------------------
  POST REQUESTS
-------------------------*/

//generates a new shortURL for specified longURL and redirects to the shortURL page
app.post("/urls/new", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { url: req.body.longURL,
                            userId: res.locals.user
                          }
  res.redirect(`/urls/${shortURL}`);
});

//deletes URL from DB and refreshes page
app.post("/urls/:id/delete", (req, res) => {
  if(res.locals.user === urlDatabase[req.params.id].userId){
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

//displays current smallURL and displays update longURL option
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect(`/urls`);
});

//logs user in, verifies they exist or throws 403 status, adds to cookie
app.post("/login", (req, res) => {
  for(var userId in users){
    if(users[userId].email === req.body.email){
      if(users[userId].password === req.body.password){
        res.cookie('userId', userId);
        res.redirect(`/urls`);
        return;
      } else{
        res.status(403).send('Password incorrect');
        return;
      }
    }
  }
  res.status(403).send('Email not found');
});

//logs user out, clears cookie
app.post("/logout", (req, res) => {
  res.clearCookie('userId');
  res.redirect(`/urls`);
});

//registers a new user
app.post("/register", (req, res) => {
  if((req.body.email).length === 0 || (req.body.password).length === 0){
    res.status(400).send('Please enter an email and a password');
    return;
  }

  for(var user in users){
    if(users[user].email === req.body.email){
      res.status(400).send('Email is already registered');
      return;
    }
  }

  if(res.statusCode !== 400){
    let newUser = {};
    newUser.id = generateRandomString();
    newUser.email = req.body.email;
    newUser.password = req.body.password;

    users[newUser.id] = newUser;
    res.cookie('userId', newUser.id);
    res.redirect('/urls');
  }
});

//listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});