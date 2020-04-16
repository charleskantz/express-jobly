const express = require("express");
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company')
const jsonSchema = require("jsonschema");
const companySchema = require("../schemas/companySchema");
const companyUpdateSchema = require("../schemas/companyUpdateSchema")

const router = new express.Router();

router.get('/', async function(req, res, next) {
  try {
    let companies;
    // if no queries passed at all, get all companies in DB
    if ( Object.keys(req.query).length === 0 ) {
      companies = await Company.getAll();
      return res.json({ companies });
    }
    // queries were passed so we do the search
    let search = req.query.search || '';
    let minEmployees = parseInt(req.query.min_employees) || 0;
    let maxEmployees = parseInt(req.query.max_employees) || 10000000; //Number.MAX_SAFE_INTEGER;

    if ( minEmployees > maxEmployees ) {
      throw new ExpressError(`The minimum employees cannot be more than the maximum employees.`, 400);
    } else {
      companies = await Company.search(search, minEmployees, maxEmployees)
      return res.json({ companies });
    }
  } catch (err) {
    return next(err);
  }
})

router.post('/', async function(req, res, next) {
  try {
    const result = jsonSchema.validate(req.body, companySchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let company = await Company.createComp(req.body);
    return res.json({company});
  } catch (err) {
    if(err.code ==='23505'){
      return next(new ExpressError(`${req.body.name} company name already exists`, 400))
    }
    return next(err)
  }
})

router.get('/:handle', async function(req, res, next) {
  
  try{
    const companyData = await Company.get(req.params.handle)

    return res.json({company: companyData})
  } catch(err) {

    return next(err)
  }

})

router.patch('/:handle', async function(req, res, next) {
  try {
    const result = jsonSchema.validate(req.body, companyUpdateSchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    const updatedCompany = await Company.updateCompany(req.params.handle, req.body)
    return res.json({company: updatedCompany})
  } catch(err) {
    if(err.code ==='23505'){
      return next(new ExpressError(`'${req.body.name || req.params.handle}' value already exists`, 400))
    }
    return next(err)
  }
})

router.delete('/:handle', async function( req, res, next) {
  try {
    const results = await Company.deleteCompany(req.params.handle)
    return res.json({message: results})

  } catch(err) {

    return next(err)
  }
})


module.exports = router;
