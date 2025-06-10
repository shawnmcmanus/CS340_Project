-- Group 44 Shawn McManus and Matthew Kerr
-- Stored Procedures File

-- Procedure to reset the entire database

-- SOURCES: ChatGPT used for formatting of file and help implementing procedures
-- into the existing backend code.
-- Ex: Given [app.js code] and [SQL code], how would you go about implementing
-- a stored proc

DROP PROCEDURE IF EXISTS sp_reset_database;
DELIMITER //

CREATE PROCEDURE sp_reset_database()
BEGIN
    SET FOREIGN_KEY_CHECKS = 0;

    DROP TABLE IF EXISTS Employee_Benefits;
    DROP TABLE IF EXISTS Payrolls;
    DROP TABLE IF EXISTS Time_Offs;
    DROP TABLE IF EXISTS Employees;
    DROP TABLE IF EXISTS Departments;
    DROP TABLE IF EXISTS Benefits;

    CREATE TABLE Departments (
        department_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        manager_name VARCHAR(50),
        budget INT
    );

    CREATE TABLE Benefits (
        benefit_id INT AUTO_INCREMENT PRIMARY KEY,
        benefit_name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        cost DECIMAL(10,2),
        provider VARCHAR(100)
    );

    CREATE TABLE Employees (
        employee_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15) NOT NULL,
        birth_date DATE NOT NULL,
        hire_date DATE NOT NULL,
        job_title VARCHAR(50) NOT NULL,
        salary INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        department_id INT,
        FOREIGN KEY (department_id) REFERENCES Departments(department_id)
            ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE Time_Offs (
        time_off_id INT AUTO_INCREMENT PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        reason VARCHAR(100) NOT NULL,
        employee_id INT,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
            ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE Payrolls (
        payroll_id INT AUTO_INCREMENT PRIMARY KEY,
        pay_period DATE NOT NULL,
        pay_date DATE NOT NULL,
        gross_pay DECIMAL(10,2),
        deduction DECIMAL(10,2),
        net_pay DECIMAL(10,2),
        employee_id INT,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
            ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE Employee_Benefits (
        employee_benefit_id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT,
        benefit_id INT,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
            ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (benefit_id) REFERENCES Benefits(benefit_id)
            ON DELETE CASCADE ON UPDATE CASCADE
    );

    INSERT INTO Departments (name, manager_name, budget) VALUES 
    ('Human Resources', 'Alice Johnson', 500000),
    ('Engineering', 'Bob Smith', 2000000),
    ('Sales', 'Betty White', 1000000);

    INSERT INTO Benefits (benefit_name, description, cost, provider) VALUES 
    ('Health Insurance', 'Covers medical expenses', 250.00, 'Blue Cross'),
    ('Dental Plan', 'Covers dental expenses', 75.00, 'Delta Dental'),
    ('Retirement 401k', 'Company retirement plan', 0.00, 'Fidelity');

    INSERT INTO Employees (first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id) VALUES 
    ('John', 'Doe', 'john.doe@company.com', '123-456-7890', '1985-04-12', '2010-06-01', 'Software Engineer', 95000, 'Active',
      (SELECT department_id FROM Departments WHERE name = 'Engineering')),
    ('Jane', 'Smith', 'jane.smith@company.com', '234-567-8901', '1990-08-20', '2015-09-15', 'HR Manager', 85000, 'Active',
      (SELECT department_id FROM Departments WHERE name = 'Human Resources')),
    ('Mike', 'Jones', 'mike.jones@company.com', '345-678-9012', '1975-02-28', '2005-01-10', 'Sales Lead', 80000, 'Active',
      (SELECT department_id FROM Departments WHERE name = 'Sales'));

    INSERT INTO Time_Offs (start_date, end_date, status, reason, employee_id) VALUES 
    ('2025-06-01', '2025-06-10', 'Approved', 'Vacation',
      (SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com')),
    ('2025-07-15', '2025-07-20', 'Pending', 'Medical',
      (SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com')),
    ('2025-08-05', '2025-08-06', 'Denied', 'Personal Errands',
      (SELECT employee_id FROM Employees WHERE email = 'mike.jones@company.com'));

    INSERT INTO Payrolls (pay_period, pay_date, gross_pay, deduction, net_pay, employee_id) VALUES 
    ('2025-05-01', '2025-05-15', 5000.00, 1000.00, 4000.00,
      (SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com')),
    ('2025-05-01', '2025-05-15', 4200.00, 800.00, 3400.00,
      (SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com')),
    ('2025-05-01', '2025-05-15', 4000.00, 700.00, 3300.00,
      (SELECT employee_id FROM Employees WHERE email = 'mike.jones@company.com'));

    INSERT INTO Employee_Benefits (employee_id, benefit_id) VALUES 
    ((SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com'),
     (SELECT benefit_id FROM Benefits WHERE benefit_name = 'Health Insurance')),
    ((SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com'),
     (SELECT benefit_id FROM Benefits WHERE benefit_name = 'Retirement 401k')),
    ((SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com'),
     (SELECT benefit_id FROM Benefits WHERE benefit_name = 'Health Insurance')),
    ((SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com'),
     (SELECT benefit_id FROM Benefits WHERE benefit_name = 'Dental Plan')),
    ((SELECT employee_id FROM Employees WHERE email = 'mike.jones@company.com'),
     (SELECT benefit_id FROM Benefits WHERE benefit_name = 'Health Insurance'));

    SET FOREIGN_KEY_CHECKS = 1;
END //

-- Procedure to delete an employee
DROP PROCEDURE IF EXISTS sp_delete_employee;

DELIMITER //

CREATE PROCEDURE sp_delete_employee(IN emp_id INT)
BEGIN
    DELETE FROM Employee_Benefits WHERE employee_id = emp_id;
    DELETE FROM Time_Offs WHERE employee_id = emp_id;
    DELETE FROM Payrolls WHERE employee_id = emp_id;
    DELETE FROM Employees WHERE employee_id = emp_id;
END //

DELIMITER ;

-- Procedure to delete a department
DROP PROCEDURE IF EXISTS sp_delete_department;

DELIMITER //

CREATE PROCEDURE sp_delete_department(IN dept_id INT)
BEGIN
    DELETE FROM Departments WHERE department_id = dept_id;
END //

DELIMITER ;

-- Procedure to delete a benefit
DROP PROCEDURE IF EXISTS sp_delete_benefit;

DELIMITER //

CREATE PROCEDURE sp_delete_benefit(IN benefit_id INT)
BEGIN
    DELETE FROM Employee_Benefits WHERE benefit_id = benefit_id;
    DELETE FROM Benefits WHERE benefit_id = benefit_id;
END //

DELIMITER ;

-- Procedure to delete a payroll
DROP PROCEDURE IF EXISTS sp_delete_payroll;

DELIMITER //

CREATE PROCEDURE sp_delete_payroll (IN p_payroll_id INT)
BEGIN
  DELETE FROM Payrolls
  WHERE payroll_id = p_payroll_id;
END //

DELIMITER ;

-- Procedure to delete a time off
DROP PROCEDURE IF EXISTS sp_delete_time_off;

DELIMITER //

CREATE PROCEDURE sp_delete_time_off(IN p_time_off_id INT)
BEGIN
  DELETE FROM Time_Offs WHERE time_off_id = p_time_off_id;
END //

DELIMITER ;

-- Procedure to delete an employee benefit
DROP PROCEDURE IF EXISTS sp_delete_employee_benefit;

DELIMITER //

CREATE PROCEDURE sp_delete_employee_benefit(IN emp_id INT, IN benefit_id INT)
BEGIN
    DELETE FROM Employee_Benefits
    WHERE employee_id = emp_id AND benefit_id = benefit_id;
END //

DELIMITER ;

-- Procedure to update an employee
DROP PROCEDURE IF EXISTS sp_update_employee;

DELIMITER //

CREATE PROCEDURE sp_update_employee(
    IN emp_id INT,
    IN first_name VARCHAR(100),
    IN last_name VARCHAR(100),
    IN email VARCHAR(100),
    IN phone VARCHAR(25),
    IN birth_date DATE,
    IN hire_date DATE,
    IN job_title VARCHAR(100),
    IN salary INT,
    IN status VARCHAR(20),
    IN department_id INT
)
BEGIN
    UPDATE Employees
    SET
        first_name = first_name,
        last_name = last_name,
        email = email,
        phone = phone,
        birth_date = birth_date,
        hire_date = hire_date,
        job_title = job_title,
        salary = salary,
        status = status,
        department_id = department_id
    WHERE employee_id = emp_id;
END //

DELIMITER ;

-- Procedure to update a department
DROP PROCEDURE IF EXISTS sp_update_department;

DELIMITER //

CREATE PROCEDURE sp_update_department(
    IN dept_id INT,
    IN dept_name VARCHAR(100),
    IN dept_budget INT
)
BEGIN
    UPDATE Departments
    SET
        name = dept_name,
        budget = dept_budget
    WHERE department_id = dept_id;
END //

DELIMITER ;

-- Procedure to update a benefit
DROP PROCEDURE IF EXISTS sp_update_benefit;

DELIMITER //

CREATE PROCEDURE sp_update_benefit(
    IN p_benefit_id INT,
    IN p_benefit_name VARCHAR(100),
    IN p_description VARCHAR(255),
    IN p_cost DECIMAL(10, 2),
    IN p_provider VARCHAR(100)
)
BEGIN
    -- Check for duplicate benefit name (excluding the current row)
    IF EXISTS (
        SELECT 1 FROM Benefits
        WHERE benefit_name = p_benefit_name AND benefit_id != p_benefit_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Duplicate benefit name not allowed';
    ELSE
        UPDATE Benefits
        SET
            benefit_name = p_benefit_name,
            description = p_description,
            cost = p_cost,
            provider = p_provider
        WHERE benefit_id = p_benefit_id;
    END IF;
END //

DELIMITER ;


-- Procedure to update a payroll
DROP PROCEDURE IF EXISTS sp_update_payroll;

DELIMITER //

CREATE PROCEDURE sp_update_payroll (
  IN p_payroll_id INT,
  IN p_pay_period DATE,
  IN p_pay_date DATE,
  IN p_gross_pay DECIMAL(10, 2),
  IN p_deduction DECIMAL(10, 2),
  IN p_net_pay DECIMAL(10, 2),
  IN p_employee_id INT
)
BEGIN
  UPDATE Payrolls
  SET
    pay_period = p_pay_period,
    pay_date = p_pay_date,
    gross_pay = p_gross_pay,
    deduction = p_deduction,
    net_pay = p_net_pay,
    employee_id = p_employee_id
  WHERE payroll_id = p_payroll_id;
END //

DELIMITER ;

-- Procedure to update a time off
DROP PROCEDURE IF EXISTS sp_update_time_off;

DELIMITER //

CREATE PROCEDURE sp_update_time_off(
  IN p_time_off_id INT,
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_status VARCHAR(50),
  IN p_reason VARCHAR(255),
  IN p_employee_id INT
)
BEGIN
  UPDATE Time_Offs
  SET 
    start_date = p_start_date,
    end_date = p_end_date,
    status = p_status,
    reason = p_reason,
    employee_id = p_employee_id
  WHERE time_off_id = p_time_off_id;
END //

DELIMITER ;

-- Procedure to update an employee benefit
DROP PROCEDURE IF EXISTS sp_update_employee_benefit;

DELIMITER //

CREATE PROCEDURE sp_update_employee_benefit(
    IN employee_benefit_id INT,
    IN new_employee_id INT,
    IN new_benefit_id INT
)
BEGIN
    UPDATE Employee_Benefits
    SET
        employee_id = new_employee_id,
        benefit_id = new_benefit_id
    WHERE Employee_Benefits.employee_benefit_id = employee_benefit_id;
END //

DELIMITER ;

-- Procedure to insert employee
DROP PROCEDURE IF EXISTS sp_insert_employee;

DELIMITER //

CREATE PROCEDURE sp_insert_employee(
    IN first_name VARCHAR(50),
    IN last_name VARCHAR(50),
    IN email VARCHAR(100),
    IN phone VARCHAR(15),
    IN birth_date DATE,
    IN hire_date DATE,
    IN job_title VARCHAR(50),
    IN salary INT,
    IN status VARCHAR(20),
    IN department_id INT
)
BEGIN
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
    );
END //

DELIMITER ;

-- Procedure to insert department
DROP PROCEDURE IF EXISTS sp_insert_department;

DELIMITER //

CREATE PROCEDURE sp_insert_department(
    IN dept_name VARCHAR(50),
    IN dept_budget INT
)
BEGIN
    INSERT INTO Departments (
        name,
        budget
    )
    VALUES (
        dept_name,
        dept_budget
    );
END //

DELIMITER ;

-- Procedure to insert benefit
DROP PROCEDURE IF EXISTS sp_insert_benefit;

DELIMITER //

CREATE PROCEDURE sp_insert_benefit(
    IN benefit_name VARCHAR(100),
    IN description VARCHAR(255),
    IN cost DECIMAL(10, 2),
    IN provider VARCHAR(100)
)
BEGIN
    INSERT INTO Benefits (
        benefit_name,
        description,
        cost,
        provider
    )
    VALUES (
        benefit_name,
        description,
        cost,
        provider
    );
END //

DELIMITER ;

-- Procedure to insert payroll
DROP PROCEDURE IF EXISTS sp_insert_payroll;

DELIMITER //

CREATE PROCEDURE sp_insert_payroll(
    IN pay_period DATE,
    IN pay_date DATE,
    IN gross_pay DECIMAL(10, 2),
    IN deduction DECIMAL(10, 2),
    IN net_pay DECIMAL(10, 2),
    IN employee_id INT
)
BEGIN
    INSERT INTO Payrolls (
        pay_period,
        pay_date,
        gross_pay,
        deduction,
        net_pay,
        employee_id
    )
    VALUES (
        pay_period,
        pay_date,
        gross_pay,
        deduction,
        net_pay,
        employee_id
    );
END //

DELIMITER ;

-- Procedure to insert time off
DROP PROCEDURE IF EXISTS sp_insert_time_off;

DELIMITER //

CREATE PROCEDURE sp_insert_time_off(
    IN start_date DATE,
    IN end_date DATE,
    IN status VARCHAR(20),
    IN reason VARCHAR(100),
    IN employee_id INT
)
BEGIN
    INSERT INTO Time_Offs (
        start_date,
        end_date,
        status,
        reason,
        employee_id
    )
    VALUES (
        start_date,
        end_date,
        status,
        reason,
        employee_id
    );
END //

DELIMITER ;

-- Procedure to insert employee benefit
DROP PROCEDURE IF EXISTS sp_insert_employee_benefit;

DELIMITER //

CREATE PROCEDURE sp_insert_employee_benefit(
    IN employee_id INT,
    IN benefit_id INT
)
BEGIN
    INSERT INTO Employee_Benefits (
        employee_id,
        benefit_id
    )
    VALUES (
        employee_id,
        benefit_id
    );
END //

DELIMITER ;