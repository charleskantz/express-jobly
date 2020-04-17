const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class User {

  static async getAll() {
    const results = await db.query(`
    SELECT username, first_name, last_name, email  
    FROM users
    `);
    return results.rows;
  }

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
  
    if ( results.rows.length > 0 ) {
      return results.rows[0];
    } else {
      throw new ExpressError(`No user with username '${username}'`, 404);
    }
  }

  static async createUser({ username, password, first_name, last_name, email, photo_url, is_admin }) {
    
    const result = await db.query(`
    INSERT INTO users (
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
        username, 
        password,
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin`, 
        [ username, password,first_name, last_name, email, photo_url, is_admin ]
    );

    return result.rows[0];
  }

  static async updateUser(username, updates) {
    const {query, values} = sqlForPartialUpdate("users", updates, "username", username)
    const results = await db.query(
      query, values
    )
    if ( results.rows.length > 0 ) {
      return results.rows[0];
    } else {
      throw new ExpressError(`No user with username '${username}' found`, 404)
    }
  }

  static async deleteUser(username) {
    const results = await db.query(`
    DELETE 
    FROM users
    WHERE username = $1
    RETURNING username`, [ username ]);

    if ( results.rows.length > 0 ) {
      return "User deleted";
    } else {
      throw new ExpressError(`No user with username '${username}' found`, 404);
    }
  }

}
module.exports = User;