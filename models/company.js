// imports
const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Company {
  // get ALL companies from DB
  static async getAll() {
    const results = await db.query(`
    SELECT handle, name FROM companies
    `);
    return results.rows;
  }
  
  // search for companies in DB by name, minimum employee count, max employee count
  static async search(searchValue, minEmployees, maxEmployees) {
    const results = await db.query(`
    SELECT handle, name
    FROM companies
    WHERE name LIKE $1
    AND num_employees > $2
    AND num_employees < $3
    `, [`%${searchValue}%`, minEmployees, maxEmployees]
    );
    if(results.rows.length === 0) { // if no results, return friendly message
      return "No results found."
    } else{
      return results.rows;
    }
  }

  // add a new company to the DB
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

  // get a single company from DB by its handle
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
    // second query to merge all related jobs to that company
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
    if ( results.rows.length > 0 ) { // if result, return first
      results.rows[0].jobs = jobs.rows;
      return results.rows[0];
    } else { // no result, throw error
      throw new ExpressError(`No company wit handle '${handle}'`, 404)
    }
  }

  // update existing company data
  static async updateCompany(handle, updates) {
    // pass to helper function sqlForPartialUpdate,
    // returns query string and values for parameterized queries
    const {query, values} = sqlForPartialUpdate("companies", updates, "handle", handle)
    const results = await db.query( query, values ) // send query and values to DB for update
    if ( results.rows.length > 0 ) { // if result, return first
      return results.rows[0];
    } else { // no results, throw an error
      throw new ExpressError(`No company with handle '${handle}' found`, 404)
    }
  }

  // delete existing company from DB
  static async deleteCompany(handle) {
    const results = await db.query(`
    DELETE 
    FROM companies
    WHERE handle = $1
    RETURNING handle`, [handle])
    if ( results.rows.length > 0 ) { // if returned a value, delete was successful
      return "Company deleted";
    } else { // didn't find company to delete, throw error
      throw new ExpressError(`No company with handle '${handle}' found`, 404)
    }
  }
}

module.exports = Company;