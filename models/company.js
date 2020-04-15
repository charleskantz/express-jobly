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

  static async create({ handle, name, num_employees, description, logo_url }) {
    console.log('input', { handle, name, num_employees, description, logo_url })
    const result = await db.query(`
    INSERT INTO companies (
      handle,
      name,
      num_employees,
      description,
      logo_url
    )
    VALUES ($1 $2 $3 $4 $5)
    RETURNING handle,
    name,
    num_employees,
    description,
    logo_url`, [ handle, name, num_employees, description, logo_url ]
    );
    return result.rows[0];
  }
}

module.export = Company;