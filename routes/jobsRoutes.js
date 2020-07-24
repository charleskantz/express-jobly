// all imports
const express = require("express");
const ExpressError = require('../helpers/expressError');
const jsonSchema = require("jsonschema");
const jobSchema = require('../schemas/jobSchema.json');
const jobUpdateSchema = require('../schemas/jobUpdateSchema.json');
const Job = require('../models/job');
const {
  ensureLoggedIn, ensureUserAdmin } = require('../middleware/auth');

const router = new express.Router();

// GET /jobs, must be logged in.
// Returns JSON: {jobs: [job, ...]}
router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    let jobs;
    // if no search queries passed, get all jobs
    if ( Object.keys(req.query).length === 0 ) {
      jobs = await Job.getAll();
      return res.json({ jobs });
    }
    // if some queries passed, run search instead
    let search = req.query.search || '';  // defaults to empty to include all
    let minSalary = parseFloat(req.query.min_salary) || 0; // defaults to 0 to include all
    let minEquity = parseFloat(req.query.min_equity) || 0; // ^^ see above
    
    jobs = await Job.search(search, minSalary, minEquity); // run search with queries, get results
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// POST new job: must be admin to post
// Returns JSON: {job: jobData}
router.post('/', ensureUserAdmin, async function(req, res, next) {
  try {
    // validate inputs
    const result = jsonSchema.validate(req.body, jobSchema);
    if ( !result.valid ) { // validation failed
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // validation passed
    let jobData = await Job.createJob(req.body);  // add job to DB
      return res.json({ job: jobData });
  } catch (err) {
    return next(err);
  }
});

// GET job by id: jobs/:id, must be logged in
// Returns JSON: {job: jobData}
router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const jobData = await Job.get(req.params.id); // grab job from DB
    return res.json({job: jobData});
  } catch (err) {
    return next(err);
  }
})

// PATCH existing job, must be admin
// Returns JSON: {job: jobData}
router.patch('/:id', ensureUserAdmin, async function(req, res, next) {
  try {
    // validate inputs
    const result = jsonSchema.validate(req.body, jobUpdateSchema);
    if ( !result.valid ) { // validation failed
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    //validation passed
    const updatedJob = await Job.updateJob(req.params.id, req.body) // sends update to DB
    return res.json({job: updatedJob})
  } catch(err) {
    return next(err);
  }
})
// DELETE a job, must be admin 
// Returns JSON: { message: "Job deleted" }
router.delete('/:id', ensureUserAdmin, async function( req, res, next) {
  try {
    const results = await Job.deleteJob(req.params.id); // send delete to DB
    return res.json({message: results});
  } catch(err) {
    return next(err);
  }
});

module.exports = router;