const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Company {

  static async getAll() {
    const results = await db.query(`
    SELECT handle, name FROM companies
    `);
    return results.rows;
  }
  
  static async search(searchValue, minEmployees, maxEmployees) {
    
    const results = await db.query(`
    SELECT handle, name
    FROM companies
    WHERE name LIKE $1
    AND num_employees > $2
    AND num_employees < $3
    `, [`%${searchValue}%`, minEmployees, maxEmployees]
    );
    if(results.rows.length === 0) {
      return "No results found."
    } else{
      return results.rows;
    }
  }

  static async createComp({handle, name, num_employees, description, logo_url}) {
    
    const result = await db.query(`
    INSERT INTO companies (
      handle,
      name,
      num_employees,
      description,
      logo_url
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING handle,
    name,
    num_employees,
    description,
    logo_url`, [ handle, name, num_employees, description, logo_url ]
    );

    return result.rows[0];
  }

  static async get(handle) {
  
    const results = await db.query(`
    SELECT handle,
      name,
      num_employees,
      description,
      logo_url
    FROM companies
    WHERE handle = $1`, [handle]
    );

    const jobs = await db.query(`
      SELECT id,
        title,
        salary,
        equity,
        company_handle
      FROM jobs
      WHERE company_handle = $1
      `, [handle]
    );
    if ( results.rows.length > 0 ) {
      results.rows[0].jobs = jobs.rows;
      return results.rows[0];
    } else {
      throw new ExpressError(`No company wit handle '${handle}'`, 404)
    }
  }

  static async updateCompany(handle, updates) {
    const {query, values} = sqlForPartialUpdate("companies", updates, "handle", handle)
    const results = await db.query(
      query, values
    )
    if ( results.rows.length > 0 ) {
      return results.rows[0];
    } else {
      throw new ExpressError(`No company with handle '${handle}' found`, 404)
    }
  }

  static async deleteCompany(handle) {
    const results = await db.query(`
    DELETE 
    FROM companies
    WHERE handle = $1
    RETURNING handle`, [handle])

    if ( results.rows.length > 0 ) {
      return "Company deleted";
    } else {
      throw new ExpressError(`No company with handle '${handle}' found`, 404)
    }
  }
}

module.exports = Company;