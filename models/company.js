const ExpressError = require("../helpers/expressError");
const db = require("../db");

class Company {
  
  static async search(searchValue, minEmployees, maxEmployees) {
    const results = await db.query(`
      SELECT handle, name
      FROM companies
      WHERE name ILIKE $1
      AND num_employees > $2
      AND num_employees < $3
      `, [`%${searchValue}%`, minEmployees, maxEmployees]
    )
    if ( results.rows.length > 0 ) {
      return results.rows;
    } else {
      throw new ExpressError(`No results for '${searchValue}'`, 404)
    }
  }
}

module.exports = Company;