const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

//setting view engine to EJS
app.set("view engine", "ejs");

//find user by the email provided and return the user object
function findUserByEmail(userEmail){
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

// find urls that belong to a user and return those urls
function urlsByUser(id){
  let filtered = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID){
      filtered[shortURL] = urlDatabase[shortURL];
    }
  }
  return filtered;
}
//generate string of 6 alphanumeric characters
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
    user: req.session.user,
  };
  req.user = req.session.user;
//tests if user is logged in with exclusion of login register
//and url that pointing redirecting ot the long url
  if(!req.user) {
    if(/^\/u\//.test(req.url) || req.url === '/login' || req.url === '/register') {
      next();
      return;
    } else {
      res.locals.error = "Must log in first :)";
      res.render("urls_error");
      return;
    }
  }
  next();
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect('/urls');
  } else {
    res.render("register");
  }
});

app.post("/register", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  //hashes password to store password securely
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
  //constructs new user into `users` database
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
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect('/urls');
  } else {
    res.render("login");
  }
});


app.post("/login", (req, res) => {
  //if cant find user by their email in the database
  //return undefined and re-render with errror message
  if (findUserByEmail(req.body.email) === undefined ) {
    res.locals.error ='Email and Password do not match';
    res.status(403);
    res.render('login');
  } else {
    let user = findUserByEmail(req.body.email);
    let inputPass = req.body.password;
    let comparePass = bcrypt.compareSync(inputPass, user.password);
    //if user does not exist and hashed password is not validated
    //give error and re-render login page
    if (!user || !comparePass ) {
      res.locals.error ='Email and Password do not match';
      res.status(403);
      res.render('login');
    } else {
      req.session.user = user;
      res.redirect("/");
    }
  }
});

//POST from delete button on urls_index
app.post('/urls/:id/delete', (req, res) => {
  let id = req.params.id;
  //if url does not belong to user, do not allow deletion
  if (urlDatabase[id].userID !== req.session.user.id) {
    res.locals.error = "Cannot delete a url that does not belong to you!";
    res.status(401);
    res.render('urls_error');
  } else {
  delete urlDatabase[id];
  res.redirect(301, '/urls');
  }
});

//redirect to external URL that the TinyURL refers too
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.locals.error = "URL not found, please try again";
    res.status(404);
    res.render('login');
  }
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(301, longURL);
});

app.get("/urls", (req, res) => {
  let urlsFiltered = urlsByUser(req.session.user.id);
  res.render("urls_index", {urls: urlsFiltered});
});

//Edits current long URL to a new Long URL and saves it in database
app.post("/urls", (req, res) => {
  let shortURL= generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    userID: req.session.user.id,
    url: longURL
  };
  res.redirect(301, `/urls/${shortURL}`);
});

//Shows urls_show page
app.get("/urls/:id", (req, res) => {
  res.locals.shortURL = req.params.id;
  res.locals.longURL = urlDatabase[req.params.id];
  //if :id does not exists, send error and re-render urls_new to create it
  if (urlDatabase[req.params.id] === undefined) {
    res.locals.error = "This TinyURL does not exist, try creating it";
    res.status(401);
    res.render('urls_new');
  } else if (urlDatabase[req.params.id].userID !== req.session.user.id) {
      res.locals.error = "Cannot view a url that does not belong to you!";
      res.render("urls_error");
  } else {
    res.render("urls_show");
  }
});

//Edits the external URL that the short URL redirects to
app.post('/urls/:id', (req, res) => {
  let id = req.params.id;
  if (urlDatabase[id].userID !== req.session.user.id) {
    res.locals.error = "Cannot change a url that does not belong to you!";
    res.status(401);
    res.render('urls_error');
  } else {
  let newURL = req.body.longURL;
  urlDatabase[id].url = newURL;
  res.redirect(301, '/urls');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
