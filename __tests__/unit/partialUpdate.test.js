const partialUpdate = require('../../helpers/partialUpdate');
const ExpressError = require('../../helpers/expressError');

// function is passed: (table, items, key, id)

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
      function () {
    const table = 'users';
    const items = {
      first_name: "Jessica"
    }
    const key = 'id';
    const id = 1;

    const result = partialUpdate(table, items, key, id);
    expect(result).toEqual({
      "query": "UPDATE users SET first_name=$1 WHERE id=$2 RETURNING *",
      "values": ["Jessica", 1]
    });
  });

  it("should generate a proper partial update query many fields", function () {
    const table = 'users';
    const items = {
      first_name: "Jessica",
      last_name: "Something",
      phone: 4155550000,
      location: "San Francisco"
    }
    const key = 'id';
    const id = 1;

    const result = partialUpdate(table, items, key, id);
    expect(result).toEqual({
      "query": "UPDATE users SET first_name=$1, last_name=$2, phone=$3, location=$4 WHERE id=$5 RETURNING *",
      "values": ["Jessica", "Something", 4155550000, "San Francisco", 1]
    });
  });

  it("Should remove columns that begin with '_'", function () {
    const table = 'users';
    const items = {
      _first_name: "Jessica",
      _last_name: "Something",
      phone: 4155550000,
      location: "San Francisco"
    }
    const key = 'id';
    const id = 1;

    const result = partialUpdate(table, items, key, id);
    expect(result).toEqual({
      "query": "UPDATE users SET phone=$1, location=$2 WHERE id=$3 RETURNING *",
      "values": [4155550000, "San Francisco", 1]
    });
  });

});
