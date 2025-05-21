-- Group 44 Shawn McManus and Matthew Kerr

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

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

-- Insert departments
INSERT INTO Departments (name, manager_name, budget) VALUES 
('Human Resources', 'Alice Johnson', 500000),
('Engineering', 'Bob Smith', 2000000),
('Sales', 'Betty White', 1000000);

-- Insert benefits
INSERT INTO Benefits (benefit_name, description, cost, provider) VALUES 
('Health Insurance', 'Covers medical expenses', 250.00, 'Blue Cross'),
('Dental Plan', 'Covers dental expenses', 75.00, 'Delta Dental'),
('Retirement 401k', 'Company retirement plan', 0.00, 'Fidelity');

-- Insert employees using subqueries for department_id
INSERT INTO Employees (first_name, last_name, email, phone, birth_date, hire_date, job_title, salary, status, department_id) VALUES 
('John', 'Doe', 'john.doe@company.com', '123-456-7890', '1985-04-12', '2010-06-01', 'Software Engineer', 95000, 'Active',
  (SELECT department_id FROM Departments WHERE name = 'Engineering')),
('Jane', 'Smith', 'jane.smith@company.com', '234-567-8901', '1990-08-20', '2015-09-15', 'HR Manager', 85000, 'Active',
  (SELECT department_id FROM Departments WHERE name = 'Human Resources')),
('Mike', 'Jones', 'mike.jones@company.com', '345-678-9012', '1975-02-28', '2005-01-10', 'Sales Lead', 80000, 'Active',
  (SELECT department_id FROM Departments WHERE name = 'Sales'));

-- Insert time offs using subqueries for employee_id
INSERT INTO Time_Offs (start_date, end_date, status, reason, employee_id) VALUES 
('2025-06-01', '2025-06-10', 'Approved', 'Vacation',
  (SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com')),
('2025-07-15', '2025-07-20', 'Pending', 'Medical',
  (SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com')),
('2025-08-05', '2025-08-06', 'Denied', 'Personal Errands',
  (SELECT employee_id FROM Employees WHERE email = 'mike.jones@company.com'));

-- Insert payrolls using subqueries for employee_id
INSERT INTO Payrolls (pay_period, pay_date, gross_pay, deduction, net_pay, employee_id) VALUES 
('2025-05-01', '2025-05-15', 5000.00, 1000.00, 4000.00,
  (SELECT employee_id FROM Employees WHERE email = 'john.doe@company.com')),
('2025-05-01', '2025-05-15', 4200.00, 800.00, 3400.00,
  (SELECT employee_id FROM Employees WHERE email = 'jane.smith@company.com')),
('2025-05-01', '2025-05-15', 4000.00, 700.00, 3300.00,
  (SELECT employee_id FROM Employees WHERE email = 'mike.jones@company.com'));

-- Insert employee benefits using subqueries for both employee_id and benefit_id
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
COMMIT;
