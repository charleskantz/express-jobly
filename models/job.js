//imports
const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Job {
  // get all jobs from DB
  static async getAll() {
    const results = await db.query(`
    SELECT title, company_handle FROM jobs
    `);
    return results.rows;
  }
  
  // search for job in DB by name, minimum salary, minimum equity
  static async search(searchValue, minSalary, minEquity) {
    const results = await db.query(`
    SELECT title, company_handle
    FROM jobs
    WHERE title ILIKE $1
    AND salary > $2
    AND equity > $3
    `, [`%${searchValue}%`, minSalary, minEquity]
    );
    if(results.rows.length === 0) { // if no results return friendly message
      return "No results found."
    } else { // return results
      return results.rows;
    }
  }

  // add new job to DB
  static async createJob({ title, salary, equity, company_handle }) {
    const result = await db.query(`
    INSERT INTO jobs (
      title,
      salary,
      equity,
      company_handle
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id,
      title,
      salary,
      equity,
      company_handle`, [ title, salary, equity, company_handle ]
    );
    return result.rows[0];
  }

  // get an existing job by job id
  static async get(id) {
    const results = await db.query(`
    SELECT id,
      title,
      salary, 
      equity,
      company_handle,
      date_posted
    FROM jobs
    WHERE id = $1`, [id]
    );
  
    if ( results.rows.length > 0 ) { // if result, return first
      return results.rows[0];
    } else { // no result, throw error
      throw new ExpressError(`No job with id '${id}'`, 404);
    }
  }

  // update existing job in DB
  static async updateJob(id, updates) {
    // pass to helper function sqlForPartialUpdate,
    // returns query string and values for parameterized queries
    const {query, values} = sqlForPartialUpdate("jobs", updates, "id", id)
    const results = await db.query( query, values ) // send query and values to DB for update
    if ( results.rows.length > 0 ) { // if result, return first
      return results.rows[0];
    } else { // no results, throw error
      throw new ExpressError(`No job with id '${id}' found`, 404)
    }
  }

  // delete a company from the DB
  static async deleteJob(id) {
    const results = await db.query(`
    DELETE 
    FROM jobs
    WHERE id = $1
    RETURNING id`, [id]);

    if ( results.rows.length > 0 ) { // if returned a value, delete was successful
      return "Job deleted";
    } else { // didn't find job, throw error
      throw new ExpressError(`No job with id '${id}' found`, 404);
    }
  }
}

module.exports = Job;