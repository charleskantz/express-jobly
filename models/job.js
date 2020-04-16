const ExpressError = require("../helpers/expressError");
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Job {
  static async getAll() {
    const results = await db.query(`
    SELECT title, company_handle FROM jobs
    `);
    return results.rows;
  }
  
  static async search(searchValue, minSalary, minEquity) {
    
    const results = await db.query(`
    SELECT title, company_handle
    FROM jobs
    WHERE title ILIKE $1
    AND salary > $2
    AND equity > $3
    `, [`%${searchValue}%`, minSalary, minEquity]
    );
    if(results.rows.length === 0) {
      return "No results found."
    } else{
      return results.rows;
    }
  }

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
  
    if ( results.rows.length > 0 ) {
      return results.rows[0];
    } else {
      throw new ExpressError(`No job with id '${id}'`, 404);
    }
  }

  static async updateJob(id, updates) {
    const {query, values} = sqlForPartialUpdate("jobs", updates, "id", id)
    const results = await db.query(
      query, values
    )
    if ( results.rows.length > 0 ) {
      return results.rows[0];
    } else {
      throw new ExpressError(`No job with id '${id}' found`, 404)
    }
  }

  static async deleteJob(id) {
    const results = await db.query(`
    DELETE 
    FROM jobs
    WHERE id = $1
    RETURNING id`, [id]);

    if ( results.rows.length > 0 ) {
      return "Job deleted";
    } else {
      throw new ExpressError(`No job with id '${id}' found`, 404);
    }
  }
}

module.exports = Job;