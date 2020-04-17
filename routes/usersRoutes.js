const express = require("express");
const ExpressError = require('../helpers/expressError');
const User = require('../models/user')
const jsonSchema = require("jsonschema");
const userSchema = require('../schemas/userSchema.json');
const userUpdateSchema = require('../schemas/userUpdateSchema.json');

const router = new express.Router();

router

module.exports = router;

router.get('/', async function(req, res, next) {
  try {
    users = await User.getAll()

    return res.json(users)
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

router.post('/', async function(req, res, next) {
  try {
    const result = jsonSchema.validate(req.body, userSchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

  let userData = await User.createUser(req.body);
      return res.json({ user: userData });
  } catch (err) {
    return next(err);
  }
  });

router.patch('/:username', async function(req, res, next) {
  try {
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

router.delete('/:username', async function( req, res, next) {
  try {
    const results = await User.deleteUser(req.params.username);
    return res.json({message: results});
  } catch(err) {
    return next(err);
  }
});

