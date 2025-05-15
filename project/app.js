/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const PORT = 43817;

const exphbs = require('express-handlebars');
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database
const db = require('./db-connector');

/*
    ROUTES
*/

// Homepage route
app.get('/', (req, res) => {
    res.render('index');  // This looks for views/index.hbs
  });

// Employees route
app.get('/employees', async (req, res) => {
    try {
        const [employees] = await db.query('SELECT * FROM Employees');
        const [departments] = await db.query('SELECT * FROM Departments');
        res.render('employees', { employees, departments });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading employees");
    }
});

app.post('/employees', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            birth_date,
            hire_date,
            job_title,
            salary,
            status,
            department_id
        } = req.body;

        const query = `
            INSERT INTO Employees 
            (first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        await db.query(query, [
            first_name,
            last_name,
            email,
            phone,
            birth_date,
            hire_date,
            job_title,
            salary,
            status,
            department_id
        ]);

        res.redirect('/employees');
    } catch (err) {
        console.error("Error inserting employee:", err);
        res.status(500).send("Error adding employee");
    }
});
  
// Departments route

app.get('/departments', async function(req, res) {
    try {
        const [departments] = await db.query("SELECT * FROM Departments");
        res.render('departments', { departments });
    } catch (err) {
        console.error("Error loading departments page:", err);
        res.status(500).send("Error loading departments page.");
    }
});

app.post('/departments', async function(req, res) {
    const { name, manager_name, budget } = req.body;

    try {
        await db.query(
            "INSERT INTO Departments (name, manager_name, budget) VALUES (?, ?, ?)",
            [name, manager_name, budget]
        );
        res.redirect('/departments');
    } catch (err) {
        console.error("Error inserting department:", err);
        res.status(500).send("Error inserting department.");
    }
});

// Benefits route
app.get('/benefits', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT benefit_name, description, cost, provider FROM Benefits');
        res.render('benefits', { data: rows });
    } catch (err) {
        console.error("Error loading benefits page:", err);
        res.status(500).send("Error loading benefits page.");
    }
});

app.post('/benefits', async (req, res) => {
    const { benefit_name, description, cost, provider } = req.body;
  
    try {
      const insertQuery = `
        INSERT INTO Benefits (benefit_name, description, cost, provider)
        VALUES (?, ?, ?, ?)
      `;
      await db.query(insertQuery, [benefit_name, description, cost, provider]);
      res.redirect('/benefits');
    } catch (err) {
      console.error('Error inserting benefit:', err);
      res.status(500).send('Error adding benefit');
    }
  });
  
// Payolls route
app.get('/payrolls', async (req, res) => {
    try {
      const [payrolls] = await db.query(`
        SELECT Payrolls.*, Employees.first_name, Employees.last_name FROM Payrolls 
        JOIN Employees ON Payrolls.employee_id = Employees.employee_id
      `);
      const [employees] = await db.query('SELECT employee_id, first_name, last_name FROM Employees');
      res.render('payrolls', { payrolls, employees });
    } catch (err) {
      console.error('Error loading payrolls:', err);
      res.status(500).send('Error loading payrolls page');
    }
  });
  
  app.post('/payrolls', async (req, res) => {
    const { pay_period, pay_date, gross_pay, deduction, net_pay, employee_id } = req.body;
    try {
      await db.query(
        'INSERT INTO Payrolls (pay_period, pay_date, gross_pay, deduction, net_pay, employee_id) VALUES (?, ?, ?, ?, ?, ?)',
        [pay_period, pay_date, gross_pay || null, deduction || null, net_pay || null, employee_id]
      );
      res.redirect('/payrolls');
    } catch (err) {
      console.error('Error adding payroll:', err);
      res.status(500).send('Error adding payroll');
    }
  });
  
  // Time Offs route
app.get('/timeoffs', async (req, res) => {
    try {
      const [timeoffs] = await db.query(`
        SELECT Time_Offs.*, Employees.first_name, Employees.last_name FROM Time_Offs 
        JOIN Employees ON Time_Offs.employee_id = Employees.employee_id
      `);
      const [employees] = await db.query('SELECT employee_id, first_name, last_name FROM Employees');
      res.render('timeoffs', { timeoffs, employees });
    } catch (err) {
      console.error('Error loading time offs:', err);
      res.status(500).send('Error loading time offs page');
    }
  });
  
  app.post('/timeoffs', async (req, res) => {
    const { start_date, end_date, status, reason, employee_id } = req.body;
    try {
      await db.query(
        'INSERT INTO Time_Offs (start_date, end_date, status, reason, employee_id) VALUES (?, ?, ?, ?, ?)',
        [start_date, end_date, status, reason, employee_id]
      );
      res.redirect('/timeoffs');
    } catch (err) {
      console.error('Error submitting time off request:', err);
      res.status(500).send('Error submitting time off request');
    }
  });
  
  /*
      LISTENER
  */

app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});