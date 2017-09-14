const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//setting view engine to EJS
app.set("view engine", "ejs");

function findUserByEmail(userEmail){
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
}
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
  },
  "user3RandomID": {
     id: "user3RandomID",
     email: "user3@example.com",
     password: "llama"
   },
   "user4RandomID": {
      id: "user4RandomID",
      email: "user4@example.com",
      password: "butts123"
    }
};
// app.use(function error(req, res, next){})
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use((req, res, next) => {
  res.locals = {
    urls: urlDatabase,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id],
  };
  next();
});

app.post("/register", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;

  if (!userEmail) {
    res.status(400);
    res.send("Must enter a vaild email");
  }
  if (!userPassword) {
    res.status(400);
    res.send("Must enter a password");
  }
  if (findUserByEmail(userEmail)) {
    res.status = 400;
    res.send("User already exists");
  }

  let userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: userEmail,
    password: userPassword
  };
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
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
  if (!user) {
    res.status(403);
    res.send('403 Forbidden: Email does not exists.');
  }
  if (req.body.password !== user.password) {
    res.status(403);
    res.send('403 Forbidden: Password does not match email');
  }
    res.cookie("user_id", user.id);
    res.redirect("/");
});

app.post("/urls", (req, res) => {
  let shortURL= generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(301, `/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect(301, '/urls');
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.redirect(404, '/urls/new');
  }
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(301, longURL);
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  res.render("urls_index");
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
  let newURL = req.body.longURL;
  urlDatabase[id] = newURL;
  res.redirect(301, '/urls');
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
