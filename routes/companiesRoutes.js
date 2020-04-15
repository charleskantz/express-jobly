const express = require("express");
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company')
// const jasonschema = require("jsonschema");
// const companySchema = require("../schemas/companySchema")

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
  console.log("req.body : ", req.body)
  try {
    let company = await Company.createComp(req.body);
    
    return res.json({company});
  } catch (err) {
    // if(err.code ==='23505'){
    //   return next(new ExpressError(`${company.name} company name already exists`))
    // }
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

    const updatedCompany = await Company.updateCompany(req.params.handle, req.body)

    return res.json({company: updatedCompany})

  } catch(err) {
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
