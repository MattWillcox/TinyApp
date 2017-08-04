const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const moment = require('moment');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  secret: 'this is super secret'
}));
app.use(methodOverride('_method'));

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
  ##GET REQUESTS
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

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(res.locals.user),
    signedIn: res.locals.user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(res.locals.user){
    const templateVars = {
      signedIn: res.locals.user
    };
    res.render("urls_new", templateVars);
    return;
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id]){
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].url,
      signedIn: res.locals.user,
      visits: urlDatabase[req.params.id].visits,
      uniqueVisitors: urlDatabase[req.params.id].uniqueVisitors
    };
    if(res.locals.user === urlDatabase[req.params.id].userId){
      res.render("urls_show", templateVars);
      return;
    } else {
      res.status(403).send('You are not logged in as this URLs owner');
    }
  } else {
    res.status(403).send('This URL does not exist');
  }
});

app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL].url;
    res.redirect('http://' + longURL);
    urlDatabase[req.params.shortURL].visits++;
    if(!urlDatabase[req.params.shortURL].uniqueVisitors.find(x => { return (x.currUser === res.locals.user); })) {
      if(!res.locals.user){
        res.locals.user = 'Anonymous';
      }
      var date = new Date();
      urlDatabase[req.params.shortURL].uniqueVisitors.push({ currUser: res.locals.user, currTime: moment().format('llll') + " UTC"});
    }
  } else {
    res.status(403).send('This URL does not exist');
  }
});

app.get("/register", (req, res) => {
  if(req.session.userId){
    res.render("/urls");
  }
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  if(req.session.userId){
    res.render("/urls");
  }
  res.render("urls_login");
});

/*------------------------
  ##POST REQUESTS
-------------------------*/

app.post("/urls", (req, res) => {
  if(req.session.userId){
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { url: req.body.longURL, userId: res.locals.user, visits: 0, uniqueVisitors: [] };
    res.redirect(`/urls/${shortURL}`);
    return;
  } else {
    res.status(403).send("you are not logged in.");
  }
});

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

app.post("/logout", (req, res) => {
  req.session.userId = null;
  res.redirect(`/urls`);
});

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

/*------------------------
  ##DELETE & PUT REQUESTS
-------------------------*/

app.delete("/urls/:id/", (req, res) => {
  if(res.locals.user){
    if(res.locals.user === urlDatabase[req.params.id].userId){
      delete urlDatabase[req.params.id];
      res.redirect(`/urls`);
      return;
    }
  } else {
    res.status(403).send('You are not logged in as this URLs owner');
  }
});

app.put("/urls/:id", (req, res) => {
  if(req.session.userId && req.session.userId === urlDatabase[req.params.id].userId){
    urlDatabase[req.params.id].url = req.body.longURL;
    res.redirect(`/urls`);
    return;
  } else {
    res.status(403).send('You are not logged in as this URLs owner');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});