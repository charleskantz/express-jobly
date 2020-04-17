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

let updatedTestUser = {
  username: 'tester1',
  first_name: 'Jester',
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com'
}

let newTestUser = {
  username: 'tester1',
  password: 'password123',
  first_name: 'Jester',
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com',
  is_admin: true
}

let badTestUser = {
  username: 'tester1',
  password: 'password123',
  first_name: 808,
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com',
  is_admin: true
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

  // PATCH routes

  it("Should update a user in the database", async function() {
    const response = await request(app).patch('/users/tester1').send(updatedTestUser);
    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).not.toHaveProperty('password');
  })

  it("Should error when sent no data", async function() {
    const response = await request(app).patch('/users/tester1').send({});
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":\"Update request does not contain any data.\"}");
  })

  it("Should reject updates and return 400 error if we pass invalid data", async function(){
    const response = await request(app).patch(`/users/tester1`).send({email: 12345});
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance.email is not of a type(s) string\"]}");
  })

  // DELETE ROUTE

  it ("Should delete the user from the database", async function() {
    const response = await request(app).delete(`/users/tester1`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual("User deleted");
  })

  it ("Should return an error if username is invalid", async function() {
    const response = await request(app).delete("/users/9999");
    expect(response.statusCode).toBe(404);
    expect(response.error.text).toEqual("{\"status\":404,\"message\":\"No user with username '9999' found\"}");
  })

})

describe("Users POST Routes Integration Tests", function() {

  beforeEach(async function () {
    await db.query("DELETE FROM users");
  });

  // POST route

  it("Should add a user to the database", async function() {
    const response = await request(app).post("/users").send(newTestUser);
    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toHaveProperty('password');
  });

  it("Should return 400 error for missing required fields ", async function(){
    const response = await request(app).post("/users").send(incompleteTestUser);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance requires property \\\"is_admin\\\"\",\"instance requires property \\\"password\\\"\"]}")
  });

  it("Should return 400 error for incorrect data types ", async function(){
    const response = await request(app).post("/users").send(badTestUser);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance.first_name is not of a type(s) string\"]}")
  });
});

  afterAll(async function() {
    // close db connection
    await db.end();
  });