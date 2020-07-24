const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/user");
const { BCRYPT_WORK_FACTOR } = require('../../config')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../../config');
const User = require("../../models/user")

process.env.NODE_ENV = 'test';

let testUser, testAdmin, testUserToken, testAdminToken;
let incompleteTestUser = {
  username: 'tester1',
  first_name: 'TesterFirstName',
  last_name: 'TesterFirstName',
  email:  'tester@test.com',
  photo_url: 'new photo!'
}

let updatedTestUser = {
  username: 'tester1',
  password: "password",
  first_name: 'Jester',
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com',
}

let adminTestUser = {
  username: 'testadmin',
  first_name: 'testadmin',
  last_name: 'tester',
  email:  'admintest@tester.com',
  photo_url: 'www.testerimg.com',
}

let newTestUser = {
  username: 'tester1',
  password: 'password123',
  first_name: 'Jester',
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com',
}

let badTestUser = {
  username: 'tester1',
  password: 'password123',
  first_name: 808,
  last_name: 'Chester',
  email:  'jesterchester@tester.com',
  photo_url: 'www.testerimg.com',
}

describe("Users GET Routes Integration Tests", function() {

  beforeEach(async function () {
    await db.query("DELETE FROM users");

    testUserToken = await User.createUser(updatedTestUser);
    testAdminToken = await User.createUser(adminTestUser);

    await db.query(`
      UPDATE users
      SET is_admin = true
      WHERE username = 'testadmin'`);

    updatedTestUser._token = testUserToken.token;
  });

  // GET routes

  it("Should get a list of all users", async function() {
    const response = await request(app).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(2);
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
    incompleteTestUser._token = testUserToken.token;
    const response = await request(app).patch('/users/tester1').send(incompleteTestUser);
    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).not.toHaveProperty('password');
  })

  it("Should error when sent no data", async function() {
    const response = await request(app).patch('/users/tester1').send({ _token: testUserToken.token });
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance is not any of [subschema 0],[subschema 1],[subschema 2],[subschema 3],[subschema 4],[subschema 5],[subschema 6]\"]}");
  })

  it("Should reject updates and return 400 error if we pass invalid data", async function(){
    const response = await request(app).patch(`/users/tester1`).send({_token: testUserToken.token, email: 12345});
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance.email is not of a type(s) string\"]}");
  })

  // DELETE ROUTE

  it ("Should delete the user from the database", async function() {
    const response = await request(app).delete(`/users/tester1`).send({ updatedTestUser });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual("User deleted");
  })

  it ("Should return an error if user tries to delete another user", async function() {
    const response = await request(app).delete("/users/9999").send({ _token: testUserToken.token });
    expect(response.statusCode).toBe(401);
    expect(response.error.text).toEqual("{\"status\":401,\"message\":\"Unauthorized\"}");
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
    expect(response.body).toHaveProperty("token");
  });

  it("Should return 400 error for missing required fields ", async function(){
    const response = await request(app).post("/users").send(incompleteTestUser);
    expect(response.statusCode).toBe(400);
    expect(response.error.text).toEqual("{\"status\":400,\"message\":[\"instance is not any of [subschema 0],[subschema 1]\"]}")
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