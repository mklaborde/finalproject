// Add packages
require("dotenv").config();
const dblib = require("./dblib.js");
const multer = require("multer");
const upload = multer();
const express = require("express");
const app = express();

// Add database package and connection string
const { Pool } = require('pg');
const { render } = require("ejs");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Setup EJS
app.set("view engine", "ejs");

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Application folders
app.use(express.static("public"));
app.use(express.static("views"));

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/search", async (req, res) => {
    // Omitted validation check
    const totRecs = await dblib.getTotalRecords();
    //Create an empty product object (To populate form with values)
    const customer = {
        cusId: "",
        cusFname: "",
        cusLname: "",
        cusState: "",
        cusSalesYTD: "",
        cusSalesPrev: ""
    };
    res.render("search", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});

app.post("/search", async (req, res) => {
    // Omitted validation check
    //  Can get this from the page rather than using another DB call.
    //  Add it as a hidden form value.
    const totRecs = await dblib.getTotalRecords();
    dblib.findProducts(req.body)
        .then(result => {
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                customer: req.body
                })
        })
        .catch(err => {
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                customer: req.body
            });
        });
});

// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {}, type: "GET" });
});

// POST /create
app.post("/create", async (req, res) => {
    //const customer = [req.body.cusId, req.body.cusFname, req.body.cusLname, req.body.cusState, req.body.cusSalesYTD, req.body.cusSalesPrev];
    const customer = req.body;
    console.log (req.body);
    //await dblib.insertProduct(customer);
    dblib.insertProduct(customer)
        .then (insertObject => {
            res.render("create", { model: customer, trans: insertObject.trans, msg: insertObject.msg, type: "POST"});
        } )
    
});

// GET /edit/5
app.get("/edit/:id", (req, res) => {
    const id = [req.params.id];
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    //pool.query(sql, id, (err, row) => {
    pool.query(sql, id) 
        .then (editQuery => {
            console.log(editQuery.rows[0]);
            res.render("edit", {model: editQuery.rows[0], type: "GET", message: "success"});
        }) 
        .catch (err => {
            console.log(err.message);
            res.render("edit", {model: err.message, type: "GET", message: "fail"});
        });
    // if (err) ...
    //res.render("edit", { model: row });
});
//});

// POST /edit/5
app.post("/edit", (req, res) => {
    const params = Object.values(req.body);
    const sql = "UPDATE customer SET cusfname = $2, cuslname = $3, cusstate = $4 , cussalesytd = $5, cussalesprev = $6 WHERE (cusid = $1)";
    pool.query(sql, params)
    .then (editResult => {
        if (editResult.rowCount === 1)
        {
            res.render("edit", {type: "POST", trans: "success", model: req.body});
        } else {
            res.render("edit", {type: "POST", trans: "error", msg: "SQL Error", model: req.body});
        }
    })
    .catch (err => {
        res.render("edit", {type: "POST", trans: "error", msg: err.message, model: req.body});
    });
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customer WHERE cusid = ?";
    pool.query(sql, id, (err, row) => {
      // if (err) ...
      res.render("delete", { model: row });
    });
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM customer WHERE cusid = ?";
    pool.query(sql, id, err => {
      // if (err) ...
      res.redirect("/books");
    });
});

//GET Input
app.get("/input", (req, res) => {
    res.render("input");
 });
 
//POST Input
app.post("/input",  upload.single('filename'), (req, res) => {
     if(!req.file || Object.keys(req.file).length === 0) {
         message = "Error: Import file not uploaded";
         return res.send(message);
     };
     //Read file line by line, inserting records
     const buffer = req.file.buffer; 
     const lines = buffer.toString().split(/\r?\n/);
 
     lines.forEach(line => {
          //console.log(line);
          product = line.split(",");
          //console.log(product);
          const sql = `INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev)
          VALUES ($1, $2, $3, $4, $5, $6)`;
          pool.query(sql, product, (err, result) => {
              if (err) {
                  console.log(`Insert Error.  Error message: ${err.message}`);
              } else {
                  console.log(`Inserted successfully`);
              }
         });
     });
     message = `Processing Complete - Processed ${lines.length} records`;
     res.send(message);
 });

//GET - Output
app.get("/output", (req, res) => {
    var message = "";
    res.render("output",{ message: message });
   });
   
//POST - Output   
app.post("/output", (req, res) => {
       const sql = "SELECT * FROM customer ORDER BY cusid";
       pool.query(sql, [], (err, result) => {
           var message = "";
           if(err) {
               message = `Error - ${err.message}`;
               res.render("output", { message: message })
           } else {
               var output = "";
               result.rows.forEach(customer => {
                   output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd},${customer.cussalesprev}}\r\n`;
               });
               res.header("Content-Type", "text/csv");
               res.attachment("export.csv");
               return res.send(output);
           };
       });
   });
