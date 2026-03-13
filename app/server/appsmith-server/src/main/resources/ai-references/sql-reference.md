# Appsmith SQL Reference

## Binding Syntax in SQL

In Appsmith, dynamic values can be injected into SQL queries using the `{{ }}` binding syntax. This allows for the creation of dynamic queries that can adapt to user inputs or other variables within the application. Appsmith automatically parameterizes these bindings to protect against SQL injection.

### Basic Binding
```sql
-- Bind a text input value to a query
SELECT * FROM users WHERE id = {{Input1.text}}

-- Bind a dropdown selected value to a query
SELECT * FROM orders WHERE status = {{Select_Status.selectedOptionValue}}
```

### Conditional Binding
```sql
-- Use conditional logic within bindings
SELECT * FROM users WHERE {{ Input1.text ? "name = '" + Input1.text + "'" : "1=1" }}

-- Dynamic table name binding
SELECT * FROM {{ TableNamePicker.selectedOptionValue }}
```

### Complex Expressions
```sql
-- Use complex expressions in bindings
SELECT * FROM users WHERE age > {{AgeInput.text}} AND city = '{{CitySelect.selectedOptionValue}}'
```

## SELECT Patterns

### Basic Selection
The `SELECT` statement is used to fetch data from a database. It can be used to retrieve all columns or specific columns from a table.

```sql
-- Retrieve all columns from the users table
SELECT * FROM users

-- Retrieve specific columns
SELECT id, name, email FROM users
```

### Pagination
Pagination is essential for handling large datasets by breaking them into manageable chunks.

```sql
-- Implement pagination with LIMIT and OFFSET
SELECT * FROM users
ORDER BY id
LIMIT {{Table1.pageSize}}
OFFSET {{(Table1.pageNo - 1) * Table1.pageSize}}
```

### Search and Filtering
Search and filtering allow users to narrow down results based on specific criteria.

```sql
-- Text search using ILIKE for case-insensitive matching
SELECT * FROM users WHERE name ILIKE '%' || {{Input_Search.text}} || '%'

-- Filter based on multiple conditions
SELECT * FROM orders WHERE status = {{Select_Status.selectedOptionValue}} AND total > {{Input_MinTotal.text}}
```

### Sorting
Sorting is used to order query results based on one or more columns.

```sql
-- Sort results dynamically based on user selection
SELECT * FROM users
ORDER BY {{Select_SortBy.selectedOptionValue || 'created_at'}} {{Select_SortDir.selectedOptionValue || 'DESC'}}
```

## INSERT Patterns

### Insert from Form Inputs
Inserting data into a table can be done using values from form inputs or other widgets.

```sql
-- Insert a new user record
INSERT INTO users (name, email, role)
VALUES (
    {{Input_Name.text}},
    {{Input_Email.text}},
    {{Select_Role.selectedOptionValue}}
)
```

### Bulk Insert
Bulk insert allows multiple records to be inserted in a single query, which can be more efficient.

```sql
-- Insert multiple records from a JSON array
INSERT INTO users (id, name, email)
SELECT id, name, email
FROM json_populate_recordset(null::users, '{{FilePicker1.files[0].data}}')
```

## UPDATE Patterns

### Update Single Record
Updating records involves modifying existing data in a table.

```sql
-- Update a user's email based on their ID
UPDATE users
SET email = {{EmailInput.text}}
WHERE id = {{UsersTable.selectedRow.id}}
```

### Update Multiple Records
Updating multiple records can be achieved using conditional logic within the query.

```sql
-- Update multiple users' names conditionally
UPDATE users
SET name = CASE
  {{Table2.updatedRows.map((user) => `WHEN id = ${user.id} THEN '${user.updatedFields.name}'`).join('\n')}}
END
WHERE id IN ({{Table2.updatedRows.map((user) => user.allFields.id).join(',')}})
```

## DELETE Patterns

### Safe Deletion
Deleting records should be done carefully to avoid accidental data loss.

```sql
-- Delete a user based on their ID
DELETE FROM users WHERE id = {{UsersTable.selectedRow.id}}
```

### Conditional Deletion
Use conditions to ensure only specific records are deleted.

```sql
-- Delete products with a specific condition
DELETE FROM products WHERE category = {{Select_Category.selectedOptionValue}} AND price < {{Input_MaxPrice.text}}
```

## Database-Specific Tips

### PostgreSQL
- Use `ILIKE` for case-insensitive searches.
- Utilize `jsonb` data type for storing JSON data efficiently.

```sql
-- PostgreSQL case-insensitive search
SELECT * FROM users WHERE name ILIKE '%{{Input_Search.text}}%'
```

### MySQL
- Use `LIKE` for pattern matching.
- Consider using `ENUM` for fields with a limited set of values.

```sql
-- MySQL pattern matching
SELECT * FROM users WHERE name LIKE '%{{Input_Search.text}}%'
```

### SQL Server
- Use `TOP` for limiting results instead of `LIMIT`.
- Use `CONVERT` for date formatting.

```sql
-- SQL Server limit results
SELECT TOP {{Input_Limit.text}} * FROM users
```

## Working with Dates

### Date Comparisons
Date comparisons are crucial for filtering records based on time.

```sql
-- Select records within a date range
SELECT * FROM events WHERE event_date BETWEEN {{DatePicker_Start.selectedDate}} AND {{DatePicker_End.selectedDate}}
```

### Date Formatting
Formatting dates can be necessary for display purposes or further processing.

```sql
-- Format a date in SQL Server
SELECT CONVERT(varchar, event_date, 101) AS formatted_date FROM events
```

### Using Moment.js
Appsmith supports Moment.js for date manipulation in queries.

```sql
-- Use Moment.js to format dates
SELECT * FROM users WHERE dob > {{moment(DatePicker1.selectedDate).format('YYYY-MM-DD')}}
```

This reference document provides a comprehensive guide to using SQL within Appsmith, covering common patterns and best practices for dynamic queries, data manipulation, and database-specific tips. By following these guidelines, developers can efficiently build and manage data-driven applications on the Appsmith platform.