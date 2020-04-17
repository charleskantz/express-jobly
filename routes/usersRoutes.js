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

module.exports = router;

router.get('/', async function(req, res, next) {
  try {
    users = await User.getAll()

    return res.json({users})
  } catch (err) {
    return next(err)
  }
})

router.get('/:username', async function(req, res, next) {
  try {
    const userData = await User.get(req.params.username);

    return res.json({user: userData});
  } catch (err) {
    return next(err);
  }

})

// Register a new user
router.post('/', async function(req, res, next) {
  try {
    const result = jsonSchema.validate(req.body, userSchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let { username, is_admin } = await User.createUser(req.body);
    let token = jwt.sign({ username, is_admin }, SECRET_KEY);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
  });

router.patch('/:username', ensureCorrectUser, async function(req, res, next) {
  try {
    //If PATCH request has no data, return error
    if ( Object.keys(req.body).length === 0 ) {
      throw new ExpressError("Update request does not contain any data.", 400);
    }
    const result = jsonSchema.validate(req.body, userUpdateSchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    const updatedUser = await User.updateUser(req.params.username, req.body)
    return res.json({user: updatedUser})
  } catch(err) {
    return next(err);
  }
})

router.delete('/:username', ensureCorrectUser, async function( req, res, next) {
  try {
    const results = await User.deleteUser(req.params.username);
    return res.json({message: results});
  } catch(err) {
    return next(err);
  }
});

module.exports = router;

