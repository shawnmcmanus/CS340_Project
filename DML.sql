-- These are some Database Manipulation queries for the Project Website
-- All queries below use the @var_name format to represent input values
-- These will be replaced by the server-side code

-- SELECT QUERIES --
-- Get all employees with their department name
SELECT e.employee_id, e.first_name, e.last_name, d.name AS department
FROM Employees e
JOIN Departments d ON e.department_id = d.department_id;

-- Get all Employee names and IDs for the Employee dropdown
SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name FROM Employees;

-- Get all Department names and IDs for the Department dropdown
SELECT d.department_id, d.name FROM Departments d;

-- Get all time_off requests for a specific employee
SELECT * FROM Time_Offs WHERE employee_id = @employee_id;

-- Query to select payroll records for a specific employee and pay period
SELECT payroll_id, pay_period, pay_date, gross_pay, net_pay
FROM Payrolls
WHERE employee_id = @employee_id_from_dropdown_input
  AND pay_period = @pay_period;

-- Get all the benefits for a specific employee
SELECT e.first_name, e.last_name, b.benefit_name, b.description, b.provider
FROM Employee_Benefits eb
JOIN Employees e ON eb.employee_id = e.employee_id
JOIN Benefits b ON eb.benefit_id = b.benefit_id
WHERE eb.employee_id = @employee_id;

-- INSERT QUERIES --
-- Add a new employee 
INSERT INTO Employees (
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
)
VALUES (
    @first_name,
    @last_name,
    @email,
    @phone,
    @birth_date,
    @hire_date,
    @job_title,
    @salary,
    @status,
    @department_id_from_dropdown_input
);

-- Add new benefit for an employee
INSERT INTO Employee_Benefits (
    employee_id,
    benefit_id
)
VALUES (
    @employee_id_from_dropdown_input,
    @benefit_id_from_dropdown_input
);

-- UPDATE QUERIES --
-- Update an employee's job title
UPDATE Employees
SET job_title = @new_job_title
WHERE employee_id = @employee_id_from_dropdown_input;

-- Update an employee's benefit
UPDATE Employee_Benefits
SET benefit_id = @new_benefit_id_from_dropdown_input
WHERE employee_id = @employee_id_from_dropdown_input 
  AND benefit_id = @old_benefit_id_from_dropdown_input;

-- DELETE QUERIES --
-- Delete an employee
DELETE FROM Employees
WHERE employee_id = @employee_id_from_dropdown_input;

-- Delete a benefit assignment for an employee
DELETE FROM Employee_Benefits
WHERE employee_id = @employee_id_from_dropdown_input
  AND benefit_id = @benefit_id_from_dropdown_input;
