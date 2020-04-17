const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/user");

process.env.NODE_ENV = 'test';

let testUser;
let incompleteTestUser = {
  username: 'tester1',
  first_name: 'TesterFirstName',
  last_name: 'TesterFirstName',
  email:  'tester@test.com',
  photo_url: 'www.testerimg.com'
}

describe("Users GET Routes Integration Tests", function() {


  beforeEach(async function () {
    await db.query("DELETE FROM users");

    result = await db.query(`
      INSERT INTO users (
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin
        )
      VALUES (
        'tester1',
        'secret',
        'TesterFirstName',
        'TesterFirstName',
        'tester@test.com',
        'www.testerimg.com',
        false
        )
      RETURNING 
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin
    `);

    testUser = result.rows[0];
  });

  // GET routes

  it("Should get a list of all users", async function() {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0]).toHaveProperty('username');
  });

  it("If username is passed as parameter in the URL it should return data about that user", async function(){
    const response = await request(app).get(`/users/tester1`);
    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toEqual(incompleteTestUser);
  })

  it("If invalid username is passed as parameter in the URL it should return error", async function(){
    const response = await request(app).get(`/users/test`);
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No user with username 'test'\"}");
   })

})

  afterAll(async function() {
    // close db connection
    await db.end();
  });