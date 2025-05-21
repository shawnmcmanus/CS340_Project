/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const PORT = 43818;

const exphbs = require('express-handlebars');
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handlebars helper funcs
const hbs = exphbs.create({});
hbs.handlebars.registerHelper('ifCond', function (v1, v2, options) {
  if (!options || typeof options.fn !== 'function' || typeof options.inverse !== 'function') {
    console.error("ifCond helper received invalid options:", options);
    return '';
  }

  return v1 == v2 ? options.fn(this) : options.inverse(this);
});


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
    const selected_id = req.query.employee_id

    try {
        const [employees] = await db.query('SELECT * FROM Employees');
        const [departments] = await db.query('SELECT * FROM Departments');
        res.render('employees', { employees, departments });

        if (selected_id) {
          const [[selectedEmployee]] = await db.query(
            'SELECT * FROM Employees WHERE employee_id = ?',
            [selected_id]
          );
          
          return res.render('employees', {employees, departments});
        }

    } catch (err) {
        console.error(err);
        return res.status(500).send("Error loading employees");
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

        return res.redirect('/employees');
    } catch (err) {
        console.error("Error inserting employee:", err);
        return res.status(500).send("Error adding employee");
    }
});

// Employee Update
app.get('/employees/edit/:id', async (req, res) => {
  const employeeId = req.params.id;

  try {
      const [[employee]] = await db.query(
          'SELECT * FROM Employees WHERE employee_id = ?',
          [employeeId]
      );
      const [departments] = await db.query('SELECT * FROM Departments');

      if (!employee) {
          return res.status(404).send("Employee not found");
      }

      res.render('edit-employee', { employee, departments });

  } catch (err) {
      console.error("Error loading employee for edit:", err);
      return res.status(500).send("Error loading employee");
  }
});

// Handle form submission
app.post('/employees/edit/:id', async (req, res) => {
  const employeeId = req.params.id;

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
          UPDATE Employees SET
              first_name = ?,
              last_name = ?,
              email = ?,
              phone = ?,
              birth_date = ?,
              hire_date = ?,
              job_title = ?,
              salary = ?,
              status = ?,
              department_id = ?
          WHERE employee_id = ?
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
          department_id,
          employeeId
      ]);

      res.redirect('/employees');
  } catch (err) {
      console.error("Error updating employee:", err);
      res.status(500).send("Error updating employee");
  }
});

// Employee Delete
app.post('/employees/:id/delete', async (req, res) => {
  const employeeId = req.params.id;

  try {
    await db.query(`DELETE FROM Employees WHERE employee_id = ?`, [employeeId]);
    res.redirect('/employees');
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).send("Error deleting employee.");
  }
});

  
// Departments route

app.get('/departments', async function (req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        Departments.department_id,
        Departments.name AS department_name,
        Departments.manager_name,
        Departments.budget,
        Employees.employee_id,
        CONCAT(Employees.first_name, ' ', Employees.last_name) AS employee_name
      FROM Departments
      LEFT JOIN Employees ON Departments.department_id = Employees.department_id
      ORDER BY Departments.department_id;
    `);

    // Group by department
    const deptMap = new Map();

    for (const row of rows) {
      const {
        department_id,
        department_name,
        manager_name,
        budget,
        employee_id,
        employee_name
      } = row;

      if (!deptMap.has(department_id)) {
        deptMap.set(department_id, {
          department_id,
          department_name,
          manager_name,
          budget,
          employees: []
        });
      }

      if (employee_id) {
        deptMap.get(department_id).employees.push({
          employee_id,
          employee_name
        });
      }
    }

    const departments = Array.from(deptMap.values());

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

  // Employee Benefits
  app.get('/employee_benefits', async (req, res) => {
    try {
      // Fetch employee-benefit relationships
      const [rows] = await db.query(`
        SELECT 
          Employees.employee_id,
          CONCAT(Employees.first_name, ' ', Employees.last_name) AS full_name,
          Benefits.benefit_id,
          Benefits.benefit_name,
          Benefits.description
        FROM Employees
        LEFT JOIN Employee_Benefits ON Employees.employee_id = Employee_Benefits.employee_id
        LEFT JOIN Benefits ON Employee_Benefits.benefit_id = Benefits.benefit_id
        ORDER BY Employees.employee_id;
      `);
  
      // Fetch all employees for the <select>
      const [allEmployees] = await db.query(`
        SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name FROM Employees;
      `);
  
      // Fetch all benefits for the <select>
      const [allBenefits] = await db.query(`
        SELECT benefit_id, benefit_name FROM Benefits;
      `);
  
      // Group benefits by employee
      const employeeMap = new Map();
      for (const row of rows) {
        const { employee_id, full_name, benefit_id, benefit_name, description } = row;
  
        if (!employeeMap.has(employee_id)) {
          employeeMap.set(employee_id, {
            employee_id,
            full_name,
            benefits: []
          });
        }
  
        if (benefit_id) {
          employeeMap.get(employee_id).benefits.push({
            benefit_id,
            benefit_name,
            description
          });
        }
      }
  
      const grouped = Array.from(employeeMap.values());
  
      res.render('employee-benefits', {
        employees: grouped,
        allEmployees,
        allBenefits
      });
    } catch (err) {
      console.error("Error loading employee benefits:", err);
      res.status(500).send("Error loading employee benefits");
    }
  });
  

app.post('/employee_benefits', async (req, res) => {
  const { employee_id, benefit_id } = req.body;

  try {
    // Check if this relationship already exists to prevent duplicates
    const [existing] = await db.query(`
      SELECT * FROM Employee_Benefits
      WHERE employee_id = ? AND benefit_id = ?
    `, [employee_id, benefit_id]);

    if (existing.length > 0) {
      return res.status(400).send("This benefit is already assigned to the employee.");
    }

    // Insert into the M:M relationship table
    await db.query(`
      INSERT INTO Employee_Benefits (employee_id, benefit_id)
      VALUES (?, ?)
    `, [employee_id, benefit_id]);

    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error inserting employee benefit:", err);
    res.status(500).send("Failed to assign benefit.");
  }
});

app.post('/employee_benefits/edit/:old_benefit_id', async (req, res) => {
  const { employee_id, new_benefit_id } = req.body;
  const { old_benefit_id } = req.params;

  try {
    // Optional: check if the new assignment already exists
    // Update the benefit for this employee
    await db.query(`
      UPDATE Employee_Benefits
      SET benefit_id = ?
      WHERE employee_id = ? AND benefit_id = ?
    `, [new_benefit_id, employee_id, old_benefit_id]);

    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error updating employee benefit:", err);
    res.status(500).send("Failed to update benefit.");
  }
});

app.post('/employee_benefits/delete/:benefit_id', async (req, res) => {
  const { employee_id } = req.body;
  const { benefit_id } = req.params;

  try {
    await db.query(`
      DELETE FROM Employee_Benefits
      WHERE employee_id = ? AND benefit_id = ?
    `, [employee_id, benefit_id]);

    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error deleting employee benefit:", err);
    res.status(500).send("Failed to delete benefit.");
  }
});

app.post('/reset', async (req, res) => {
  try {
    await db.query("CALL sp_reset_database()");
    res.redirect('/');
  } catch (err) {
    console.error("RESET failed:", err);
    res.status(500).send("RESET failed");
  }
});

  /*
      LISTENER
  */

app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});
