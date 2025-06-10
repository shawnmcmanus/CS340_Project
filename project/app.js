/* 
SOURCES: Used ChatGPT to help add proper date formatting and handlebar
helper funcs and to implement the new stored procs from pl.sql.
Also, used it for guidance on how to group M:N entities together
Ex #1: Given the following date [paste date], how could I
go about making it the format January 1, 2000
Ex #2: Given the M:N relationship between Employees and
Benefits, how would I go about grouping them so they benefits
are with the correct employee
*/

/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const PORT = 43818;

const exphbs = require('express-handlebars');
const moment = require('moment');
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Handlebars helper funcs
const hbs = exphbs.create({});
hbs.handlebars.registerHelper('ifCond', function (v1, v2, options) {
  if (!options || typeof options.fn !== 'function' || typeof options.inverse !== 'function') {
    console.error("ifCond helper received invalid options:", options);
    return '';
  }

  return v1 == v2 ? options.fn(this) : options.inverse(this);
});

hbs.handlebars.registerHelper('formatDate', function(date) {
  return moment(date).format('MMMM D, YYYY');
});

hbs.handlebars.registerHelper('eq', function (a, b) {
  return a == b;
});

hbs.handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
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

// Inserts new employee
app.post('/employees', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id } = req.body;
    await db.query('CALL sp_insert_employee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id]);
    res.redirect('/employees');
  } catch (err) {
    console.error("Error inserting employee:", err);
    res.status(500).send("Error adding employee");
  }
});

// Gets employee id for update form
app.get('/employees/:id/json', async (req, res) => {
  const employeeId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM Employees WHERE employee_id = ?', [employeeId]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).send("Error fetching employee data");
  }
});

// Updates employee info
app.post('/employees/edit/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id } = req.body;
    await db.query('CALL sp_update_employee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [employeeId, first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id]);
    res.redirect('/employees');
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).send("Error updating employee");
  }
});

// Deletes employee
app.post('/employees/:id/delete', async (req, res) => {
  try {
    await db.query("CALL sp_delete_employee(?)", [req.params.id]);
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
        budget,
        employee_id,
        employee_name
      } = row;

      if (!deptMap.has(department_id)) {
        deptMap.set(department_id, {
          department_id,
          department_name,
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

// Inserts new department
app.post('/departments', async (req, res) => {
  try {
    await db.query('CALL sp_insert_department(?, ?)', [req.body.name, req.body.budget]);
    res.redirect('/departments');
  } catch (err) {
    console.error("Error inserting department:", err);
    res.status(500).send("Error inserting department.");
  }
});

// Gets department for update form
app.get('/departments/:id/json', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM Departments WHERE department_id = ?', [req.params.id]);
  res.json(rows[0]);
});

// Updates department info
app.post('/departments/edit/:id', async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { department_name, budget } = req.body;
    await db.query('CALL sp_update_department(?, ?, ?)', [departmentId, department_name, budget]);
    res.redirect('/departments');
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).send("Error updating department");
  }
});

// Deletes department
app.post('/delete-department/:id', async (req, res) => {
  try {
    await db.query('CALL sp_delete_department(?)', [req.params.id]);
    res.redirect('/departments');
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).send("Error deleting department.");
  }
});


// Benefits route
app.get('/benefits', async function (req, res) {
    try {
        const [rows] = await db.query('SELECT benefit_id, benefit_name, description, cost, provider FROM Benefits');
        res.render('benefits', { data: rows });
    } catch (err) {
        console.error("Error loading benefits page:", err);
        res.status(500).send("Error loading benefits page.");
    }
});

// Insert new benefit
app.post('/benefits', async (req, res) => {
  try {
    const { benefit_name, description, cost, provider } = req.body;
    await db.query('CALL sp_insert_benefit(?, ?, ?, ?)', [benefit_name, description, cost, provider]);
    res.redirect('/benefits');
  } catch (err) {
    console.error("Error inserting benefit:", err);
    res.status(500).send("Error adding benefit");
  }
});

// Gets benefit info for update form
app.get('/benefits/:id/json', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM Benefits WHERE benefit_id = ?', [req.params.id]);
  res.json(rows[0]);
});

// Updates benefit info
app.post('/benefits/edit/:id', async (req, res) => {
  try {
    const benefitId = req.params.id;
    const { benefit_name, description, cost, provider } = req.body;
    await db.query('CALL sp_update_benefit(?, ?, ?, ?, ?)', [benefitId, benefit_name, description, cost, provider]);
    res.redirect('/benefits');
  } catch (err) {
    console.error("Error updating benefit:", err);
    res.status(500).send("Error updating benefit");
  }
});

// Deletes benefit
app.post('/delete-benefit/:id', async (req, res) => {
  try {
    await db.query('CALL sp_delete_benefit(?)', [req.params.id]);
    res.redirect('/benefits');
  } catch (err) {
    console.error("Error deleting benefit:", err);
    res.status(500).send("Error deleting benefit.");
  }
});


// Payrolls route
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

// Insert new payroll
app.post('/payrolls', async (req, res) => {
  try {
    const { pay_period, pay_date, gross_pay, deduction, net_pay, employee_id } = req.body;
    await db.query('CALL sp_insert_payroll(?, ?, ?, ?, ?, ?)', [pay_period, pay_date, gross_pay, deduction, net_pay, employee_id]);
    res.redirect('/payrolls');
  } catch (err) {
    console.error('Error adding payroll:', err);
    res.status(500).send('Error adding payroll');
  }
});

// Gets payroll for update form
app.get('/payrolls/:id/json', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Payrolls WHERE payroll_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching payroll:', err);
    res.status(500).send('Error fetching payroll');
  }
});

// Update payroll info
app.post('/payrolls/edit/:id', async (req, res) => {
  try {
    const { pay_period, pay_date, gross_pay, deduction, net_pay, employee_id } = req.body;
    await db.query('CALL sp_update_payroll(?, ?, ?, ?, ?, ?, ?)', [
      req.params.id,
      pay_period,
      pay_date,
      gross_pay,
      deduction,
      net_pay,
      employee_id
    ]);
    res.redirect('/payrolls');
  } catch (err) {
    console.error('Error updating payroll:', err);
    res.status(500).send('Error updating payroll');
  }
});

// Delete payroll
app.post('/delete-payroll/:id', async (req, res) => {
  try {
    await db.query('CALL sp_delete_payroll(?)', [req.params.id]);
    res.redirect('/payrolls');
  } catch (err) {
    console.error('Error deleting payroll:', err);
    res.status(500).send('Error deleting payroll');
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
  
// Insert new time-off request  
app.post('/timeoffs', async (req, res) => {
  try {
    const { start_date, end_date, status, reason, employee_id } = req.body;
    await db.query('CALL sp_insert_time_off(?, ?, ?, ?, ?)', [start_date, end_date, status, reason, employee_id]);
    res.redirect('/timeoffs');
  } catch (err) {
    console.error('Error submitting time off request:', err);
    res.status(500).send('Error submitting time off request');
  }
});

// Get time-off request
app.get('/timeoffs/:id/json', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Time_Offs WHERE time_off_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching time-off:', err);
    res.status(500).send('Error fetching time-off');
  }
});

// Update time-off request
app.post('/timeoffs/edit/:id', async (req, res) => {
  try {
    const { start_date, end_date, status, reason, employee_id } = req.body;
    await db.query('CALL sp_update_time_off(?, ?, ?, ?, ?, ?)', [
      req.params.id,
      start_date,
      end_date,
      status,
      reason,
      employee_id
    ]);
    res.redirect('/timeoffs');
  } catch (err) {
    console.error('Error updating time-off request:', err);
    res.status(500).send('Error updating time-off request');
  }
});

// Delete time-off request
app.post('/delete-timeoff/:id', async (req, res) => {
  try {
    await db.query('CALL sp_delete_time_off(?)', [req.params.id]);
    res.redirect('/timeoffs');
  } catch (err) {
    console.error('Error deleting time-off:', err);
    res.status(500).send('Error deleting time-off');
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
          Employee_Benefits.employee_benefit_id,
          Benefits.benefit_id,
          Benefits.benefit_name,
          Benefits.description
        FROM Employees
        LEFT JOIN Employee_Benefits ON Employees.employee_id = Employee_Benefits.employee_id
        LEFT JOIN Benefits ON Employee_Benefits.benefit_id = Benefits.benefit_id
        ORDER BY Employees.employee_id;
      `);
  
      const [allEmployees] = await db.query(`
        SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name FROM Employees;
      `);
  
      const [allBenefits] = await db.query(`
        SELECT benefit_id, benefit_name FROM Benefits;
      `);
  
      // Group benefits by employee
      const employeeMap = new Map();
      for (const row of rows) {
        const { employee_id, full_name, benefit_id, benefit_name, description, employee_benefit_id } = row;
  
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
            description,
            employee_benefit_id
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

// Insert new employee benefit
app.post('/employee_benefits', async (req, res) => {
  try {
    const { employee_id, benefit_id } = req.body;
    await db.query('CALL sp_insert_employee_benefit(?, ?)', [employee_id, benefit_id]);
    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error inserting employee benefit:", err);
    res.status(500).send("Failed to assign benefit.");
  }
});

// Update employee benefit
app.post('/employee_benefits/edit/:id', async (req, res) => {
  try {
    const { new_employee_id, new_benefit_id } = req.body;
    const employee_benefit_id = req.params.id;

    await db.query('CALL sp_update_employee_benefit(?, ?, ?)', [
      employee_benefit_id,
      new_employee_id,
      new_benefit_id
    ]);

    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error updating employee benefit:", err);
    res.status(500).send("Failed to update benefit.");
  }
});

// Delete employee benefit
app.post('/employee_benefits/delete/:benefit_id', async (req, res) => {
  try {
    await db.query('CALL sp_delete_employee_benefit(?, ?)', [req.body.employee_id, req.params.benefit_id]);
    res.redirect('/employee_benefits');
  } catch (err) {
    console.error("Error deleting employee benefit:", err);
    res.status(500).send("Failed to delete benefit.");
  }
});


// Reset database
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