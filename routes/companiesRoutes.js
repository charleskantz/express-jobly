// imports
const express = require("express");
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company')
const jsonSchema = require("jsonschema");
const companySchema = require("../schemas/companySchema");
const companyUpdateSchema = require("../schemas/companyUpdateSchema");
const {
  ensureLoggedIn, ensureUserAdmin } = require('../middleware/auth');

const router = new express.Router();


// GET list of companies (all or by search), must be logged in
// Returns JSON: {companies: [companyData, ...]}
router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    let companies;
    // if no queries passed at all, get all companies in DB
    if ( Object.keys(req.query).length === 0 ) {
      companies = await Company.getAll(); // get all companies in DB
      return res.json({ companies });
    }
    // queries were passed so we do the search
    let search = req.query.search || ''; // defaults to empty to include all
    let minEmployees = parseInt(req.query.min_employees) || 0; // defaults to 0 to include all
    let maxEmployees = parseInt(req.query.max_employees) || 10000000; // defaults super high to include all. note: Number.MAX_SAFE_INTEGER was too much for SQL
    // make sure that min employees is not more than the max employees
    if ( minEmployees > maxEmployees ) {
      throw new ExpressError(`The minimum employees cannot be more than the maximum employees.`, 400);
    } else {
      companies = await Company.search(search, minEmployees, maxEmployees) // search for companies in DB
      return res.json({ companies });
    }
  } catch (err) {
    return next(err);
  }
})

// POST a new company, must be admin
// Returns JSON: {company: companyData}
router.post('/', ensureUserAdmin, async function(req, res, next) {
  try {
    // validate inputs
    const result = jsonSchema.validate(req.body, companySchema);
    if ( !result.valid ) { // validation failed
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // validation passed
    let company = await Company.createComp(req.body); // post new company to DB
    return res.json({company});
  } catch (err) {
    if(err.code ==='23505'){ // if company name already exists, throw error
      return next(new ExpressError(`${req.body.name} company name already exists`, 400))
    }
    return next(err)
  }
})

// GET by company handle: /companies/:handle, must be logged in
// Returns JSON: {company: companyData}
router.get('/:handle', ensureLoggedIn, async function(req, res, next) {
  try {
    const companyData = await Company.get(req.params.handle) // get company by handle in DB
    return res.json({company: companyData})
  } catch(err) {
    return next(err)
  }
})

// PATCH an existing company, must be admin
// Returns JSON: {company: companyData}
router.patch('/:handle', ensureUserAdmin, async function(req, res, next) {
  try {
    // validate inputs
    const result = jsonSchema.validate(req.body, companyUpdateSchema);
    if ( !result.valid ) { // validation failed
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // validation passed
    const updatedCompany = await Company.updateCompany(req.params.handle, req.body)
    return res.json({company: updatedCompany})
  } catch(err) {
    if(err.code ==='23505'){  // if company name or handle already exists, throw an error
      return next(new ExpressError(`'${req.body.name}' value already exists`, 400))
    }
    return next(err)
  }
})

// DELETE a company, must be an admin
// Returns JSON: {message: "Company deleted"}
router.delete('/:handle', ensureUserAdmin, async function( req, res, next) {
  try {
    const results = await Company.deleteCompany(req.params.handle) // send Delete to DB
    return res.json({message: results})
  } catch(err) {
    return next(err)
  }
})

module.exports = router;