const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  secret: 'this is super secret'
}));


// default port 8080
const PORT = process.env.PORT || 8080;

//current Database of URLS
const urlDatabase = {
};

//current DB of users
const users = {
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
  res.locals.user = req.session.userId;
  next();
});

/*------------------------
  GET REQUESTS
-------------------------*/

//index page that just displays Hello!
app.get("/", (req, res) => {
  if(res.locals.user){
    res.redirect('/urls');
  } else{
    res.redirect('/login');
  }
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
    signedIn: res.locals.user
  };
  res.render("urls_index", templateVars);
});

//renders /urls/new page with urls_new.ejs
app.get("/urls/new", (req, res) => {
  if(res.locals.user){
    const templateVars = {
      signedIn: res.locals.user
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

//renders /urls/:id page (:id = shortURL) with urls_show.ejs
app.get("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id]){
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].url,
      signedIn: res.locals.user
    };
    if(res.locals.user === urlDatabase[req.params.id].userId){
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send('You are not logged in as this URLs owner'');
    }
  } else {
    res.status(403).send('This URL does not exist');
  }
});

//redirects client to the longURL version of provided short URL
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL].url;
    res.redirect('http://' + longURL);
  } else {
    res.status(403).send('This URL does not exist');
  }
});

//renders /register page
app.get("/register", (req, res) => {
  if(req.session.userId){
    res.render("/urls");
  }
  res.render("urls_register");
});

//renders /login page
app.get("/login", (req, res) => {
  if(req.session.userId){
    res.render("/urls");
  }
  res.render("urls_login");
});


/*------------------------
  POST REQUESTS
-------------------------*/

//generates a new shortURL for specified longURL and redirects to the shortURL page
app.post("/urls", (req, res) => {
  if(req.session.userId){
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { url: req.body.longURL, userId: res.locals.user };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("you are not logged in.");
  }
});

//deletes URL from DB and refreshes page
app.post("/urls/:id/delete", (req, res) => {
  if(res.locals.user){
    if(res.locals.user === urlDatabase[req.params.id].userId){
      delete urlDatabase[req.params.id];
      res.redirect(`/urls`);
    }
  } else {
    res.status(403).send('You are not logged in as this URLs owner');
  }
});

//displays current smallURL and displays update longURL option
app.post("/urls/:id", (req, res) => {
  if(req.session.userId && req.session.userId === urlDatabase[req.params.id].userId){
    urlDatabase[req.params.id].url = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.status(403).send('You are not logged in as this URLs owner');
  }
});

//logs user in, verifies they exist or throws 403 status, adds to cookie
app.post("/login", (req, res) => {
  for(var userId in users){
    if(users[userId].id === req.body.email){
      if(bcrypt.compareSync(req.body.password, users[userId].password)){
        req.session.userId = users[userId].id;
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
  req.session.userId = null;
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
    newUser.id = req.body.email;
    newUser.password = bcrypt.hashSync(req.body.password, 10);

    users[newUser.id] = newUser;
    req.session.userId = newUser.id;
    res.redirect('/urls');
  }
});

//listening port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});