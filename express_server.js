const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

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
    // hashedPassword: bcrypt.hashSync(password, 10)
},
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "2a$10$Cbn2ZWuRG9/mtVSoJ2P.fOi1UW.cXAjWxYh3kslECFgRxLY1RHXGe",
    // hashedPassword: bcrypt.hashSync(password, 10)
  },
  "user3RandomID": {
     id: "user3RandomID",
     email: "user3@example.com",
     password: "$2a$10$HUQv48aBmyc6S2jdi4.mfea62mbwkW7l1XTG.wwYFUY1zC2NW7.UG",
    //  hashedPassword: bcrypt.hashSync(password, 10)
   },
   "user4RandomID": {
      id: "user4RandomID",
      email: "user4@example.com",
      password: "$2a$10$VoRYwQeWEq3URSGXrfGdTuzcyKyoTfwEyvamKes6eMdHjNknt1.BO",
      // hashedPassword: bcrypt.hashSync(password, 10)
    }
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use((req, res, next) => {
  res.locals = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id],
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
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id){
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
    res.cookie("user_id", user.id);
    res.redirect("/");
  }
});

app.post("/urls", (req, res) => {
  let shortURL= generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(301, `/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  let id = req.params.id;
  if (urlDatabase[id].userID !== req.cookies.user_id) {
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
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id){
    res.locals.error = "Must login to view URLs";
    res.render("login");
  } else {
  let urlsFiltered = urlsByUser(req.cookies.user_id);
  res.render("urls_index", {urls: urlsFiltered});
  }
});

app.get("/urls/:id", (req, res) => {
  res.locals.shortURL = req.params.id;
  res.locals.longURL = urlDatabase[req.params.id];
  if (urlDatabase[req.params.id] === undefined) {
    res.redirect('/urls/new');
  }
  res.render("urls_show");
});

app.post('/urls/:id', (req, res) => {
  let id = req.params.id;
  if (urlDatabase[id].userID !== req.cookies.user_id) {
    res.locals.error = "Cannot delete a url that does not belong to you!";
    res.status(401);
    res.render('urls_index');
  } else {
  let newURL = req.body.longURL;
  urlDatabase[id] = newURL;
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
