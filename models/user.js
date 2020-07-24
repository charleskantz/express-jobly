// imports
const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")
const { BCRYPT_WORK_FACTOR } = require('../config')
const bcrypt = require("bcrypt");

class User {
  // get all users from DB
  static async getAll() {
    const results = await db.query(`
    SELECT username, first_name, last_name, email  
    FROM users
    `);
    return results.rows;
  }

  // get a user by username
  static async get(username) {
    const results = await db.query(`
    SELECT username,
      first_name,
      last_name, 
      email,
      photo_url
    FROM users
    WHERE username = $1`, [username]
    );
    if ( results.rows.length > 0 ) { // if result, return first
      return results.rows[0];
    } else { // no result, throw error
      throw new ExpressError(`No user with username '${username}'`, 404);
    }
  }

  // adds a new user to the DB
  static async createUser({ username, password, first_name, last_name, email, photo_url }) {
    // use Bcrypt to hash password before entering to DB
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`
      INSERT INTO users (
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING (
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin
        )`, 
        [ username, hashedPassword, first_name, last_name, email, photo_url ]
    );
    return result.rows[0];
  }

  // authenticate a user logging in
  static async authenticate(username, password) {
    const result = await db.query( // see if user is in DB
      "SELECT password, is_admin FROM users WHERE username = $1",
      [username]); // return is_admin value for JWT
    let is_admin = false; // ensure is_admin value exists for return statement
    let user = result.rows[0]; // see if user exists
    if ( user ) {
      is_admin = user.is_admin; // updates is_admin with user's is_admin value
    }
    // use Bcrypt to compare submitted password to DB hashed password
    let authentication = user && await bcrypt.compare(password, user.password);
    // if both the user exists AND the password matches, authentication returns true
    // if either fail, authentication returns false
    return {authentication, is_admin };
  }

  // updates existing user in DB
  static async updateUser(username, updates) {
    // pass to helper function sqlForPartialUpdate,
    // returns query string and values for parameterized queries
    const {query, values} = sqlForPartialUpdate("users", updates, "username", username);
    const results = await db.query( query, values ); // send query and values to DB for update
    if ( results.rows.length > 0 ) { // if result, return first result
      delete results.rows[0].password; // delete password from user object before returning
      return results.rows[0];
    } else { // no result, throw error
      throw new ExpressError(`No user with username '${username}' found`, 404)
    }
  }

  // delete user from DB
  static async deleteUser(username) {
    const results = await db.query(` 
    DELETE 
    FROM users
    WHERE username = $1
    RETURNING username`, [ username ]);

    if ( results.rows.length > 0 ) { // if value is returned, return message
      return "User deleted";
    } else { // no value returned so delete failed, throw error
      throw new ExpressError(`No user with username '${username}' found`, 404);
    }
  }
}

module.exports = User;