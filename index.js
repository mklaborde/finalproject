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
        type: "GET",
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
                type: "POST",
                totRecs: totRecs.totRecords,
                result: result,
                customer: req.body
                })
            })
        .catch(err => {
            res.render("search", {
                type: "POST",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                customer: req.body
            });
        });
});

//GET Reports
app.get("/reports", (req, res) => {
    res.render("reports", {
        type: "GET"
    });
});

app.post("/reports", async (req, res) => {
    customer = {
        cus_Id: "",
        cus_Fname: "",
        cus_Lname: "",
        cus_State: "",
        cus_SalesYTD: "",
        cus_SalesPrev: ""
    };
    if (req.body.reports === 'allByLast')
    {
        res.render("reports", {
            type: "POST",
            result: await dblib.findProductsByFirstandLast(customer),
            model: req.body
        });
    }
    if (req.body.reports === 'allBySalesDec')
    {
        res.render("reports", {
            type: "POST",
            result: await dblib.findProductsBySales(customer),
            model: req.body
        });
    }
    if (req.body.reports === 'threeRandom')
    {
        result=[];
        customers = await dblib.findProducts(customer);
        for (i=0; i<3; i++)
        {
            randomIndex = Math.floor(Math.random() * customers.result.length);
            result.push(customers.result[randomIndex]);
        }
        res.render("reports", {
            type: "POST",
            result: {trans: "success", result: result},
            model: req.body
        });
    }

    console.log(req.body);
});

// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {}, type: "GET" });
});

// POST /create
app.post("/create", async (req, res) => {
    const customer = req.body;
    console.log (req.body);
    dblib.insertProduct(customer)
        .then (insertObject => {
            res.render("create", { model: customer, trans: insertObject.trans, msg: insertObject.msg, type: "POST"});
        } )
    
});

// GET /edit/5
app.get("/edit/:id", (req, res) => {
    const id = [req.params.id];
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    pool.query(sql, id) 
        .then (editQuery => {
            console.log(editQuery.rows[0]);
            res.render("edit", {model: editQuery.rows[0], type: "GET", message: "success"});
        }) 
        .catch (err => {
            console.log(err.message);
            res.render("edit", {model: err.message, type: "GET", message: "fail"});
        });
});


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
    const id = [req.params.id];
    const sql = "SELECT * FROM customer WHERE cusid = $1";
        pool.query(sql, id) 
            .then (deleteQuery => {
                console.log(deleteQuery.rows[0]);
                res.render("delete", {model: deleteQuery.rows[0], type: "GET", message: "success"});
            }) 
            .catch (err => {
                console.log(err.message);
                res.render("delete", {model: err.message, type: "GET", message: "fail"});
            });
    });


// POST /delete/5
app.post("/delete", (req, res) => {
    const params = [req.body.cusid];
    const sql = "DELETE FROM customer WHERE (cusid = $1)";
    console.log(sql);
    console.log(params);
    pool.query(sql, params)
    .then (deleteResult => {
        if (deleteResult.rowCount === 1)
        {
            res.render("delete", {type: "POST", trans: "success", model: req.body});
        } else {
            res.render("delete", {type: "POST", trans: "error", msg: "SQL Error", model: req.body});
        }
    })
    .catch (err => {
        res.render("delete", {type: "POST", trans: "error", msg: err.message, model: req.body});
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
     customers=[];     

     lines.forEach(line => {
          //console.log(line);
          customer = line.split(",");
          //console.log(customer);
          customers.push(customer);
     });
     numInserted=0;
     numFailed=0;
     errorMessage="";
     (async () => {
        for (customer of customers) {
            const result = await dblib.insertProduct(customer);
            if (result.trans === "success") {
                numInserted++;
            } else {
                numFailed++;
                errorMessage += `${result.msg} <br>`;
            };
        };    
        res.send({numberInserted: numInserted, numberFailed: numFailed, msg: errorMessage});
        /*console.log(`Records processed: ${numInserted + numFailed}`);
        console.log(`Records successfully inserted: ${numInserted}`);
        console.log(`Records with insertion errors: ${numFailed}`);
        if(numFailed > 0) {
            console.log("Error Details:");
            console.log(errorMessage);
        };*/
    })()
    
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
