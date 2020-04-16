const express = require("express");
const ExpressError = require('../helpers/expressError');
const jsonSchema = require("jsonschema");
const jobSchema = require('../schemas/jobSchema.json');
const jobUpdateSchema = require('../schemas/jobUpdateSchema.json');
const Job = require('../models/job');

const router = new express.Router();


router.get('/', async function(req, res, next) {
  try {
    let jobs;
    if ( Object.keys(req.query).length === 0 ) {
      jobs = await Job.getAll();
      return res.json({ jobs });
    }
    let search = req.query.search || '';
    let minSalary = parseFloat(req.query.min_salary) || 0;
    let minEquity = parseFloat(req.query.min_equity) || 0;
    
    jobs = await Job.search(search, minSalary, minEquity);
    
    return res.json({ jobs });
    
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function(req, res, next) {
try {
  const result = jsonSchema.validate(req.body, jobSchema);

  if ( !result.valid ) {
    let listOfErrors = result.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error);
  }

  let jobData = await Job.createJob(req.body);
    return res.json({ job: jobData });
} catch (err) {
  return next(err);
}
});

router.get('/:id', async function(req, res, next) {
  try {
    const jobData = await Job.get(req.params.id);

    return res.json({job: jobData});
  } catch (err) {
    return next(err);
  }

})

router.patch('/:id', async function(req, res, next) {
  try {
    const result = jsonSchema.validate(req.body, jobUpdateSchema);

    if ( !result.valid ) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    const updatedJob = await Job.updateJob(req.params.id, req.body)
    return res.json({job: updatedJob})
  } catch(err) {
    return next(err);
  }
})

router.delete('/:id', async function( req, res, next) {
  try {
    const results = await Job.deleteJob(req.params.id);
    return res.json({message: results});
  } catch(err) {
    return next(err);
  }
});

module.exports = router;