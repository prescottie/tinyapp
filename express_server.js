const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

//setting view engine to EJS
app.set("view engine", "ejs");

function findUserByEmail(userEmail){
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

function urlsByUser(id){
  let filtered = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID){
      filtered[shortURL] = urlDatabase[shortURL];
    }
  }
  return filtered;
}

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
}
const urlDatabase = {
  "b2xVn2": { userID: "userRandomID",
            url:"http://www.lighthouselabs.ca"},
  "9sm5xK": { userID: "user2RandomID",
            url:"http://www.google.com"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$tRDjKpJKk9fbTe/OOSNd8eM1yX5le.P3gqg10wWUkm8ErBuV5xjP.",
    // '1'
},
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$Z6ZeWvXxhyrxEzlP8iXoTul.mNdUDgNbSKct4yppJoKfAB7o2kMzK",
    // 2
  },
  "user3RandomID": {
     id: "user3RandomID",
     email: "user3@example.com",
     password: "$2a$10$HUQv48aBmyc6S2jdi4.mfea62mbwkW7l1XTG.wwYFUY1zC2NW7.UG",
    //  llama
   },
   "user4RandomID": {
      id: "user4RandomID",
      email: "user4@example.com",
      password: "$2a$10$VoRYwQeWEq3URSGXrfGdTuzcyKyoTfwEyvamKes6eMdHjNknt1.BO",
      // butts123
    }
};
// Middleware for parsing form data in the body of the request
app.use(bodyParser.urlencoded({extended: true}));

// Middleware for setting cookie session tokens
app.use(cookieSession({
  keys: ["wingding", "llama"]
}));

// SET LOCALS
app.use((req, res, next) => {
  res.locals = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: req.session.user
  };
  next();
});

app.post("/register", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let hashedPassword = bcrypt.hashSync(userPassword, 10);
  if (!userEmail) {
    res.locals.error = "Must enter a valid email";
    res.status(400);
    res.render('register');
  }
  if (!userPassword) {
    res.locals.error = "Must enter a password";
    res.status(400);
    res.render('register');
  }
  if (findUserByEmail(userEmail)) {
    res.locals.error = "User by that email already exists";
    res.status(400);
    res.render('register');
  }

  let userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: userEmail,
    password: hashedPassword
  };
  req.session.user = users[userId];
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user){
    res.locals.error = "Must login to create new short URLs";
    res.render("login");
  }
  res.render("urls_new");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let user = findUserByEmail(req.body.email);
  let inputPass = req.body.password;
  let comparePass = bcrypt.compareSync(inputPass, user.password);
  if (!user || !comparePass) {
    res.locals.error ='Email and Password do not match';
    res.status(403);
    res.render('login');
  } else {
    req.session.user = user;
    res.redirect("/");
  }
});

app.post("/urls", (req, res) => {
  let shortURL= generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    userID: req.session.user.id,
    url: longURL
  };
  res.redirect(301, `/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  let id = req.params.id;
  if (urlDatabase[id].userID !== req.session.user) {
    res.locals.error = "Cannot delete a url that does not belong to you!";
    res.status(401);
    res.render('urls_index');
  } else {
  delete urlDatabase[id];
  res.redirect(301, '/urls');
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.locals.error = "URL not found, please try again";
    res.status(404);
    res.render('register');
  }
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(301, longURL);
});

app.get("/", (req, res) => {
  if (!req.session.user){
    res.redirect('/login');
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session.user){
    res.locals.error = "Must login to view URLs";
    res.render("login");
  } else {
  let urlsFiltered = urlsByUser(req.session.user.id);
  res.render("urls_index", {urls: urlsFiltered});
  }
});

app.get("/urls/:id", (req, res) => {
  res.locals.shortURL = req.params.id;
  res.locals.longURL = urlDatabase[req.params.id];
  if (!req.session.user){
    res.locals.error = "Must login to view TinyURL's";
    res.render('login');
  }
  if (urlDatabase[req.params.id] === undefined) {
    res.locals.error = "This TinyURL does not exist, try creating it";
    res.status(401);
    res.render('urls_new');
  } else if (urlDatabase[req.params.id].userID !== req.session.user.id) {
      res.locals.error = "Cannot view a url that does not belong to you!";
      res.redirect("/urls");
  } else {
    res.render("urls_show");
  }
});

app.post('/urls/:id', (req, res) => {
  let id = req.params.id;
  if (urlDatabase[id].userID !== req.session.user.id) {
    res.locals.error = "Cannot delete a url that does not belong to you!";
    res.status(401);
    res.render('urls_index');
  } else {
  let newURL = req.body.longURL;
  urlDatabase[id].url = newURL;
  res.redirect(301, '/urls');
  }
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
