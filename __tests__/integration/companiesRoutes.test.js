
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/company");

process.env.NODE_ENV = 'test';

let testCompany;
let testCompanyData = {"handle": "testcompany", "name": "Toy Company", "description": "We make wooden toys", "num_employees": 50, "logo_url": "www.toys.com"}
let incompleteCompanyData = {"name": "Toy Company", "description": "We make wooden toys", "num_employees": 50, "logo_url": "www.toys.com"}
let badCompanyData = {"name": "Toy Company", "description": 1000, "num_employees": "50", "logo_url": "www.toys.com"}

describe("Company GET Routes Integration Tests", function() {


  beforeEach(async function () {
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
  });

  // GET routes

  it("Should get a list of all companies", async function() {
    const response = await request(app).get('/companies');

    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty('handle');
  });

  it("Should search for a company by name", async function() {
    const response = await request(app).get('/companies?search=test');
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty('handle');

  });

  it("Should return error if given a bad name", async function() {
    const response = await request(app).get('/companies?search=Nope');
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toEqual('No results found.');

  });

  it("Should error if min employees > max employees", async function() {
    const response = await request(app).get('/companies?min_employees=500&max_employees=100');
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual('{"status":400,"message":"The minimum employees cannot be more than the maximum employees."}');
  });

  it("Should return search results if empty string in search", async function() {
    const response = await request(app).get('/companies?max_employees=100');
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty('handle');
  });

  it("If company handle is passed as parameter in the URL it should return data about an existing company", async function(){
    const response = await request(app).get(`/companies/testcompany`);
    expect(response.statusCode).toBe(200);
    expect(response.body.company).toHaveProperty('handle');
    expect(response.body.company).toHaveProperty('jobs');
  })

  it("If invalid company handle is passed as parameter in the URL it should return error", async function(){
    const response = await request(app).get(`/companies/test`);
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No company wit handle 'test'\"}");
  })

  //PATCH route
  //send an empty object
  it("Should update a company in the database", async function() {
    const response = await request(app).patch("/companies/testcompany").send(incompleteCompanyData);
    expect(response.statusCode).toBe(200);
    expect(response.body.company).toEqual(testCompanyData)
  })
  it("Should reject updates and return 400 error if we pass invlaid data", async function(){
    const response = await request(app).patch("/companies/testcompany").send(badCompanyData);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance.num_employees is not of a type(s) integer\",\"instance.description is not of a type(s) string\"]}");
  })

  // DELETE route

  it ("Should delete the company from the database", async function() {
    const response = await request(app).delete("/companies/testcompany");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual("Company deleted");
  })

  it ("Should return an error if handle is invalid", async function() {
    const response = await request(app).delete("/companies/test");
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No company with handle 'test' found\"}");
  })
});

describe("Company POST Routes Integration Tests", function() {

  beforeEach(async function () {
    await db.query("DELETE FROM companies");
  })

  // POST route

  it("Should add a company to the databse", async function() {
    const response = await request(app).post("/companies").send(testCompanyData);
    expect(response.statusCode).toBe(200);
    expect(response.body.company).toHaveProperty('handle')
    expect(response.body.company).toEqual(testCompanyData);
  })
  it("Should return 400 error for missing required fields ", async function(){
    const response = await request(app).post("/companies").send(incompleteCompanyData);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance requires property \\\"handle\\\"\"]}")
  })
});

afterAll(async function() {
  // close db connection
  await db.end();
});