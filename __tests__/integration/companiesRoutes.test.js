
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/company");

process.env.NODE_ENV = 'test';
let testCompany;

describe("Company Routes Integration Tests", function() {


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

  it("Should error if given a bad name", async function() {
    const response = await request(app).get('/companies?search=Nope');
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual('{"status":404,"message":"No results for Nope"}');

  });

  it("Should error if min employees > max employees", async function() {
    const response = await request(app).get('/companies?min_employees=500&max_employees=100');
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual('{"status":400,"message":"The minimum employees cannot be more than the maximum employees."}');

  });

});
  
  

  // POST route

  // PATCH route

  // DELETE route


afterAll(async function() {
  // close db connection
  await db.end();
});