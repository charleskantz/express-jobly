process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/company");


let testCompany;

describe("Company Routes Integration Tests", function() {


  beforeEach(async function () {
    console.error("literally anything")
    // await db.query("DELETE FROM companies");

    testCompany = await db.query(`
      INSERT INTO companies (
        handle,
        name
        )
      VALUES (
        'test',
        'test company inc.'
        )
        `);

    console.error("TEST COMPANY ~~~~~~~",testCompany.rows);
  });

  it("Should get a list of all companies", async function() {
    const response = await request(app).get('/companies');
    console.error("RESP BODY ~~", response.body);
    expect(response.body).toEqual(testCompany.rows);
    expect(response.statusCode).toBe(200);
  })

});
  
  // GET routes
  

  // POST route

  // PATCH route

  // DELETE route


afterAll(async function() {
  // close db connection
  await db.end();
});