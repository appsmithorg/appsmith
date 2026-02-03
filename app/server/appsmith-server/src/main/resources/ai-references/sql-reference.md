# Appsmith SQL Reference

## Binding Syntax in SQL Queries

Use `{{ }}` bindings to inject dynamic values into SQL queries. Appsmith automatically parameterizes these bindings, protecting against SQL injection.

```sql
-- Basic binding from widget
SELECT * FROM users WHERE id = {{Input1.text}}

-- Binding from table selection
SELECT * FROM orders WHERE user_id = {{Table1.selectedRow.id}}

-- Multiple bindings
SELECT * FROM products
WHERE category = {{Select1.selectedOptionValue}}
AND price <= {{Input_MaxPrice.text}}
```

## Parameterized Queries (SQL Injection Safe)

Appsmith uses prepared statements automatically. Bindings are parameterized, not string-concatenated:

```sql
-- SAFE: Appsmith parameterizes this automatically
SELECT * FROM users WHERE email = {{Input1.text}}

-- The binding {{Input1.text}} becomes a prepared statement parameter
-- NOT concatenated as: WHERE email = 'user@example.com'
```

## SELECT Patterns

### Basic Selection
```sql
-- All columns
SELECT * FROM users

-- Specific columns
SELECT id, name, email FROM users

-- With conditions
SELECT * FROM users WHERE status = {{Select_Status.selectedOptionValue}}
```

### Pagination
```sql
-- Standard pagination pattern
SELECT * FROM products
ORDER BY created_at DESC
LIMIT {{Table1.pageSize}}
OFFSET {{(Table1.pageNo - 1) * Table1.pageSize}}
```

### Search and Filtering
```sql
-- Text search with LIKE
SELECT * FROM users
WHERE name ILIKE {{'%' + Input_Search.text + '%'}}

-- Conditional WHERE clause
SELECT * FROM orders
WHERE 1=1
{{Select_Status.selectedOptionValue ? "AND status = '" + Select_Status.selectedOptionValue + "'" : ""}}
```

### Sorting
```sql
-- Dynamic sort (be careful with SQL injection for column names)
SELECT * FROM users
ORDER BY {{Select_SortBy.selectedOptionValue || 'created_at'}}
{{Select_SortDir.selectedOptionValue || 'DESC'}}
```

## INSERT Patterns

### Insert from Form Inputs
```sql
INSERT INTO users (name, email, role)
VALUES (
    {{Input_Name.text}},
    {{Input_Email.text}},
    {{Select_Role.selectedOptionValue}}
)
```

### Insert with Returning (PostgreSQL)
```sql
INSERT INTO users (name, email)
VALUES ({{Input_Name.text}}, {{Input_Email.text}})
RETURNING id, name, email
```

## UPDATE Patterns

### Update Selected Row
```sql
UPDATE users
SET
    name = {{Input_Name.text}},
    email = {{Input_Email.text}},
    updated_at = NOW()
WHERE id = {{Table1.selectedRow.id}}
```

### Conditional Update
```sql
UPDATE orders
SET status = {{Select_NewStatus.selectedOptionValue}}
WHERE id = {{Table1.selectedRow.id}}
AND status != 'completed'
```

## DELETE Patterns

```sql
-- Delete selected row
DELETE FROM users WHERE id = {{Table1.selectedRow.id}}

-- Soft delete pattern
UPDATE users SET deleted_at = NOW() WHERE id = {{Table1.selectedRow.id}}
```

## Database-Specific Tips

### PostgreSQL
```sql
-- JSONB queries
SELECT * FROM users WHERE metadata->>'role' = {{Select1.selectedOptionValue}}

-- Array contains
SELECT * FROM products WHERE tags @> ARRAY[{{Input1.text}}]

-- Upsert
INSERT INTO users (email, name) VALUES ({{email}}, {{name}})
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
```

### MySQL
```sql
-- Insert or update
INSERT INTO users (email, name) VALUES ({{email}}, {{name}})
ON DUPLICATE KEY UPDATE name = VALUES(name)

-- LIMIT with offset
SELECT * FROM users LIMIT {{offset}}, {{limit}}
```

### SQL Server
```sql
-- Pagination with OFFSET/FETCH
SELECT * FROM users
ORDER BY id
OFFSET {{offset}} ROWS
FETCH NEXT {{limit}} ROWS ONLY
```

## Working with Dates

```sql
-- Date comparison
SELECT * FROM orders
WHERE created_at >= {{DatePicker_Start.selectedDate}}
AND created_at <= {{DatePicker_End.selectedDate}}

-- Current date/time (database function)
SELECT * FROM events WHERE event_date = CURRENT_DATE
```

## Aggregate Queries

```sql
-- Count with grouping
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status

-- Sum with conditions
SELECT SUM(amount) as total
FROM orders
WHERE user_id = {{Table1.selectedRow.id}}
AND status = 'completed'
```

## Best Practices

1. **Always use bindings** for user input to prevent SQL injection
2. **Use LIMIT** on SELECT queries to avoid loading excessive data
3. **Add WHERE clauses** to UPDATE/DELETE to avoid affecting all rows
4. **Use RETURNING** (PostgreSQL) or OUTPUT (SQL Server) to get affected rows
5. **Test with sample data** before running destructive queries
