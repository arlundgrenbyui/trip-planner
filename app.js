const path = require('path');
require('dotenv').config();
const cors = require('cors') // Place this with other requires (like 'path' and 'express')
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const {Client} = require("@googlemaps/google-maps-services-js");

const errorController = require('./controllers/error');
const User = require('./models/user')

const app = express();

const corsOptions = {
  origin: "https://kmal-trip-planner.herokuapp.com/",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  family: 4
};

const PORT = process.env.PORT || 5000; // So we can run on heroku || (OR) localhost:5000
const MONGODB_URL = process.env.MONGODB_URL;

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use("/public", express.static('public'));

const userRoutes = require('./routes/user');
const tripRoutes = require('./routes/trip');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next) => {
  if (req.header('x-forwarded-proto') == 'http') {
    res.redirect(301, 'https://' + 'kmal-trip-planner.herokuapp.com' + req.url)
    return
  }
  next()
});

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/user', userRoutes);
app.use(tripRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});

const client = new Client({});

client
  .directions({
    params: {
      origin: { lat: 45, lng: -110 },
      destination: { lat: -110, lng: 45 },
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
    timeout: 1000, // milliseconds
  })
  .then((r) => {
    console.log(r.data);
  })
  .catch((e) => {
    console.log(e.response.data.error_message);
  });

mongoose
  .connect(
    MONGODB_URL, options
  )
  .then(result => {
      app.listen(PORT);
  })
  .catch(err => {
    console.log(err);
  });