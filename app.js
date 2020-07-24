/** Express app for jobly. */
const express = require("express");
const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");
const app = express();
const User = require('./models/user');
const { authenticateJWT } = require("./middleware/auth");
const { SECRET_KEY } = require("./config");
const jwt = require("jsonwebtoken");

app.use(express.json());

// get auth token for all routes
app.use(authenticateJWT);

// add logging system
app.use(morgan("tiny"));  // TODO: what does this do?

// route loading
const companiesRoutes = require('./routes/companiesRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const usersRoutes = require('./routes/usersRoutes');

// route middleware

app.use('/companies', companiesRoutes);
app.use('/jobs', jobsRoutes);
app.use('/users', usersRoutes);

// Login route
app.post("/login", async function (req, res, next) {
  try {
    let { username, password } = req.body;
    let result = await User.authenticate(username, password); // could destructure here
    if (result.authentication) { // user is authorized
      let is_admin = result.is_admin;
      let token = jwt.sign({ username, is_admin }, SECRET_KEY);
      return res.json({ token });
    } else {  //  user is rejected
      throw new ExpressError("Invalid username/password", 400);
    }
  }
  catch (err) {
    return next(err);
  }
});

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);

  return res.json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;
