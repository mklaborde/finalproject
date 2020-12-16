// Add packages
require("dotenv").config();
// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

const insertProduct = (customer) => {
    // Will accept either a customer array or customer object
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };

    const sql = `INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev)
                 VALUES ($1, $2, $3, $4, $5, $6)`;

    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success", 
                msg: `Customer id ${params[0]} successfully inserted`
            };
        })
        .catch(err => {
            return {
                trans: "fail", 
                msg: `Error on insert of product id ${params[0]}.  ${err.message}`
            };
        });
};

const findProducts = (customer) => {
    // Will build query based on data provided from the form
    //  Use parameters to avoid sql injection

    // Declare variables
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cus_Id !== "") {
        params.push(parseInt(customer.cus_Id));
        sql += ` AND cusId = $${i}`;
        i++;
    };
    if (customer.cus_Fname !== "") {
        params.push(`${customer.cus_Fname}%`);
        sql += ` AND UPPER(cusFname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_Lname !== "") {
        params.push(`${customer.cus_Lname}%`);
        sql += ` AND UPPER(cusLname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_State !== "") {
        params.push(`${customer.cus_State}`);
        sql += ` AND UPPER (cusState) = UPPER($${i})`;
        i++;
    };
    if (customer.cus_SalesYTD !== "") {
        params.push(parseFloat(customer.cus_SalesYTD));
        sql += ` AND cusSalesYTD >= $${i}`;
        i++;
    };
    if (customer.cus_SalesPrev !== "") {
        params.push(parseFloat(customer.cus_SalesPrev));
        sql += ` AND cusSalesPrev >= $${i}`;
        i++;
    };
    sql += ` ORDER BY cusId`;
    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

const findProductsByFirstandLast = (customer) => {
    // Will build query based on data provided from the form
    //  Use parameters to avoid sql injection

    // Declare variables
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cus_Id !== "") {
        params.push(parseInt(customer.cus_Id));
        sql += ` AND cusId = $${i}`;
        i++;
    };
    if (customer.cus_Fname !== "") {
        params.push(`${customer.cus_Fname}%`);
        sql += ` AND UPPER(cusFname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_Lname !== "") {
        params.push(`${customer.cus_Lname}%`);
        sql += ` AND UPPER(cusLname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_State !== "") {
        params.push(`${customer.cus_State}`);
        sql += ` AND UPPER (cusState) = UPPER($${i})`;
        i++;
    };
    if (customer.cus_SalesYTD !== "") {
        params.push(parseFloat(customer.cus_SalesYTD));
        sql += ` AND cusSalesYTD >= $${i}`;
        i++;
    };
    if (customer.cus_SalesPrev !== "") {
        params.push(parseFloat(customer.cus_SalesPrev));
        sql += ` AND cusSalesPrev >= $${i}`;
        i++;
    };
    sql += ` ORDER BY cusLname, cusFname`;
    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

const findProductsBySales = (customer) => {
    // Will build query based on data provided from the form
    //  Use parameters to avoid sql injection

    // Declare variables
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cus_Id !== "") {
        params.push(parseInt(customer.cus_Id));
        sql += ` AND cusId = $${i}`;
        i++;
    };
    if (customer.cus_Fname !== "") {
        params.push(`${customer.cus_Fname}%`);
        sql += ` AND UPPER(cusFname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_Lname !== "") {
        params.push(`${customer.cus_Lname}%`);
        sql += ` AND UPPER(cusLname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cus_State !== "") {
        params.push(`${customer.cus_State}`);
        sql += ` AND UPPER (cusState) = UPPER($${i})`;
        i++;
    };
    if (customer.cus_SalesYTD !== "") {
        params.push(parseFloat(customer.cus_SalesYTD));
        sql += ` AND cusSalesYTD >= $${i}`;
        i++;
    };
    if (customer.cus_SalesPrev !== "") {
        params.push(parseFloat(customer.cus_SalesPrev));
        sql += ` AND cusSalesPrev >= $${i}`;
        i++;
    };
    sql += ` ORDER BY cusSalesYTD DESC`;
    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};



module.exports.getTotalRecords = getTotalRecords;
module.exports.insertProduct = insertProduct;
module.exports.findProducts = findProducts;
module.exports.findProductsByFirstandLast = findProductsByFirstandLast;
module.exports.findProductsBySales = findProductsBySales;