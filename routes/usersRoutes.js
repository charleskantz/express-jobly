// imports
const express = require("express");
const ExpressError = require('../helpers/expressError');
const User = require('../models/user');
const jsonSchema = require("jsonschema");
const userSchema = require('../schemas/userSchema.json');
const userUpdateSchema = require('../schemas/userUpdateSchema.json');
const { SECRET_KEY } = require('../config');
const jwt = require("jsonwebtoken");
const { ensureCorrectUser } = require('../middleware/auth');

const router = new express.Router();

// GET all users: /users.
// Returns JSON: {users: [{username, first_name, last_name, email}, ...]}
router.get('/', async function(req, res, next) {
  try {
    users = await User.getAll() // grab all users from db
    return res.json({users})
  } catch (err) {
    return next(err)
  }
})
// GET user by username: /users/:username
// Returns JSON: {user: {username, first_name, last_name, email, photo_url}}
router.get('/:username', async function(req, res, next) {
  try {
    const userData = await User.get(req.params.username);

    return res.json({user: userData});
  } catch (err) {
    return next(err);
  }
})

// POST new user: /users, will add new user to DB
// returns JSON token: {token: token}
router.post('/', async function(req, res, next) {
  try {
    // validate inputs
    const result = jsonSchema.validate(req.body, userSchema);
    if ( !result.valid ) { // fails validation
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    //validation passed
    let { username, is_admin } = await User.createUser(req.body);  // submit new user to DB
    let token = jwt.sign({ username, is_admin }, SECRET_KEY);  // create token
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

// PATCH users/:username, will update an existing user, only by that user
// Returns JSON: {user: {username, first_name, last_name, email, photo_url}}
router.patch('/:username', ensureCorrectUser, async function(req, res, next) {
  try {
    //If PATCH request has no data, return error
    if ( Object.keys(req.body).length === 0 ) {
      throw new ExpressError("Update request does not contain any data.", 400);
    }
    // validate inputs
    const result = jsonSchema.validate(req.body, userUpdateSchema);
    if ( !result.valid ) {  // validation failed
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // validation passed
    const updatedUser = await User.updateUser(req.params.username, req.body) // submit updated to DB
    return res.json({user: updatedUser})
  } catch(err) {
    return next(err);
  }
})

//DELETE a user: users/:username, will delete a user, only by that user
router.delete('/:username', ensureCorrectUser, async function( req, res, next) {
  try {
    const results = await User.deleteUser(req.params.username); // deletes user from DB
    return res.json({message: results});
  } catch(err) {
    return next(err);
  }
});

module.exports = router;

