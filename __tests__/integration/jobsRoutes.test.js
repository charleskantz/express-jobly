
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/company");

process.env.NODE_ENV = 'test';

// let testCompany;
// let testCompanyData = {"handle": "testcompany", "name": "Toy Company", "description": "We make wooden toys", "num_employees": 50, "logo_url": "www.toys.com"}
// let incompleteCompanyData = {"name": "Toy Company", "description": "We make wooden toys", "num_employees": 50, "logo_url": "www.toys.com"}
// let badCompanyData = {"name": "Toy Company", "description": 1000, "num_employees": "50", "logo_url": "www.toys.com"}

let testJobData = {
  "title": "testdeveloper",
  "salary": 25000,
  "equity": .5,
  "company_handle": "testcompany"
}

let incompleteTestJobData = {
  "salary": 100000,
  "equity": .7
}

let badTestJobData = {
  "title": "testdeveloper",
  "salary": 25000,
  "equity": 1.1,
  "company_handle": "testcompany"
}

let jobID = 0;

describe("Job GET Routes Integration Tests", function() {

  beforeEach(async function () {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");

    testCompany = await db.query(`
      INSERT INTO companies (
        handle,
        name,
        num_employees
        )
      VALUES (
        'testcompany',
        'test company inc.',
        2
        )
    `);

    testJob = await db.query(`
      INSERT INTO jobs (
        title,
        salary,
        equity,
        company_handle
        )
      VALUES (
        'testdeveloper',
        25000,
        .05,
        'testcompany'
        )
        RETURNING id
    `);

    jobID = testJob.rows[0].id;
    console.error("~~~~~~ JOB ID ~~~~~~", jobID);
  });

  // GET routes

  it("Should get a list of all jobs", async function() {
    const response = await request(app).get('/jobs');

    expect(response.statusCode).toBe(200);
    expect(response.body.jobs).toHaveLength(1);
    expect(response.body.jobs[0]).toHaveProperty('title');
  });

  it("Should search for a job by title", async function() {
    const response = await request(app).get('/jobs?search=test');
    expect(response.statusCode).toBe(200);
    expect(response.body.jobs).toHaveLength(1);
    expect(response.body.jobs[0]).toHaveProperty('title');
  });

  it("Should return error if given a bad name", async function() {
    const response = await request(app).get('/jobs?search=Nope');
    expect(response.statusCode).toBe(200);
    expect(response.body.jobs).toEqual('No results found.');
  });

  it("If job id is passed as parameter in the URL it should return data about that job", async function(){
    const response = await request(app).get(`/jobs/${jobID}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.job).toHaveProperty('title');
  })

  it("If invalid job id is passed as parameter in the URL it should return error", async function(){
    const response = await request(app).get(`/jobs/9999`);
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No job with id '9999'\"}");
  })

  //PATCH route

  //send an empty object
  it("Should update a job in the database", async function() {
    const response = await request(app).patch(`/jobs/${jobID}`).send(incompleteTestJobData);
    expect(response.statusCode).toBe(200);
    expect(response.body.job.salary).toEqual(100000);
    expect(response.body.job.equity).toEqual(0.7);
  })

  it("Should reject updates and return 400 error if we pass invalid data", async function(){
    const response = await request(app).patch(`/jobs/${jobID}`).send(badTestJobData);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance.equity must have a maximum value of 1\"]}");
  })

//   // DELETE route

  it ("Should delete the job from the database", async function() {
    const response = await request(app).delete(`/jobs/${jobID}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual("Job deleted");
  })

  it ("Should return an error if job id is invalid", async function() {
    const response = await request(app).delete("/jobs/9999");
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No job with id '9999' found\"}");
  })

  it ("Should delete jobs connected to a company when that company is deleted", async function() {
    await request(app).delete(`/companies/testcompany`);
    const response = await request(app).delete(`/jobs/${jobID}`);
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual(`{\"status\":404,\"message\":\"No job with id '${jobID}' found\"}`);
  })

});

describe("Job POST Routes Integration Tests", function() {

  beforeEach(async function () {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");

    testCompany = await db.query(`
      INSERT INTO companies (
        handle,
        name,
        num_employees
        )
      VALUES (
        'testcompany',
        'test company inc.',
        2
        )
    `);
  })

  // POST route

  it("Should add a job to the database", async function() {
    const response = await request(app).post("/jobs").send(testJobData);
    expect(response.statusCode).toBe(200);
    expect(response.body.job).toHaveProperty('title');
    expect(response.body.job).toHaveProperty('id');
  })
  it("Should return 400 error for missing required fields ", async function(){
    const response = await request(app).post("/jobs").send(incompleteTestJobData);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance requires property \\\"title\\\"\"]}")
  })
});

afterAll(async function() {
  // close db connection
  await db.end();
});