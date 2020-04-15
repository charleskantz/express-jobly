const express = require("express");
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company')

const router = new express.Router();

router.get('/', async function(req, res, next) {
  try {
    let search = req.query.search || "";
    let minEmployees = parseInt(req.query.min_employees) || 0;
    let maxEmployees = parseInt(req.query.max_employees) || 99999999;

    if ( minEmployees > maxEmployees ) {
      throw new ExpressError(`The minimum employees cannot be more than the maximum employees.`, 400);
    } else {
      const companies = await Company.search(search, minEmployees, maxEmployees)
      return res.json({ companies });
    }
  } catch (err) {
    return next(err);
  }
})

router.post('/', async function(req, res, next) {
  let handle = req.body.handle;
  let name = req.body.name;
  let num_employees = req.body.num_employees;
  let description = req.body.description;
  let logo_url = req.body.logo_url;
  
  try {
    let company = await Company.create(handle, name, num_employees, description, logo_url);
    return res.json({company});
  } catch (err) {
    return next(err);
  }
})
module.exports = router;
