const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//setting view engine to EJS
app.set("view engine", "ejs");

// app.use(function error(req, res, next){})
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
}
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/login", (req, res) => {
  res.cookie('username', `${req.body.username}`);
  res.redirect("/urls");

});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.redirect('/urls/new');
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
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
