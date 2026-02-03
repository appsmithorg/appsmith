# Appsmith Common Issues and Troubleshooting

## Binding Issues

### Binding Not Updating

**Problem**: Widget shows stale data or binding doesn't reflect changes.

**Solutions**:
- Verify widget name matches exactly (case-sensitive): `{{Input1.text}}` not `{{input1.text}}`
- Ensure binding is wrapped in double curly braces: `{{...}}`
- Check that the referenced widget exists on the current page
- For query data, ensure the query has run: `{{Query1.data}}` is empty until Query1 executes

### Binding Shows [object Object]

**Problem**: Widget displays `[object Object]` instead of expected value.

**Solutions**:
- Access specific property: `{{Query1.data[0].name}}` not `{{Query1.data[0]}}`
- Use `JSON.stringify()` for debugging: `{{JSON.stringify(Query1.data)}}`
- For arrays, use `.map()` or access by index

## Query Execution Issues

### Query Not Running

**Problem**: Query doesn't execute or returns no data.

**Solutions**:
- Check query name matches: `await Query1.run()` (exact name)
- Verify datasource connection is configured and tested
- Check for syntax errors in the query
- Ensure required parameters are provided in `Query1.run({ param: value })`
- Check "Run on page load" setting in query configuration

### Stale Data After Query Run

**Problem**: Data doesn't update after running a query.

**Solutions**:
```javascript
// WRONG: Query hasn't completed yet
Query1.run();
console.log(Query1.data); // Still shows old data

// CORRECT: Wait for query completion
const data = await Query1.run();
console.log(data); // Fresh data

// Or use .then()
Query1.run().then(data => {
    console.log(data);
});
```

### Query Runs Multiple Times

**Problem**: Query executes repeatedly or in an infinite loop.

**Solutions**:
- Avoid running queries in widget property bindings
- Use JSObject functions for complex logic
- Check "Run on page load" isn't triggering along with manual runs
- Ensure widget `onTextChanged` doesn't trigger query on every keystroke (use debounce)

## Type Conversion Issues

### String Instead of Number

**Problem**: Input values are strings, causing comparison or math errors.

**Solutions**:
```javascript
// Input1.text is always a string
const quantity = parseInt(Input1.text, 10);
const price = parseFloat(Input1.text);
const amount = Number(Input1.text);

// In bindings
{{parseInt(Input1.text) * 2}}

// Safe conversion with default
{{Number(Input1.text) || 0}}
```

### Date Formatting Issues

**Problem**: Dates don't display correctly or comparisons fail.

**Solutions**:
```javascript
// Use moment.js (globally available in Appsmith)
{{moment(DatePicker1.selectedDate).format("YYYY-MM-DD")}}

// Parse string to date
{{moment(Table1.selectedRow.created_at).format("MMM DD, YYYY")}}

// Date comparison
{{moment(date1).isBefore(date2)}}

// For SQL queries, format appropriately
{{moment(DatePicker1.selectedDate).format("YYYY-MM-DD")}}
```

## Null and Undefined Handling

### Cannot Read Property of Undefined

**Problem**: Error when accessing properties of null/undefined values.

**Solutions**:
```javascript
// Optional chaining
{{Table1.selectedRow?.name}}

// Nullish coalescing for defaults
{{Input1.text ?? "Default"}}

// Combined
{{Table1.selectedRow?.name ?? "No selection"}}

// Check before access
{{Table1.selectedRow ? Table1.selectedRow.name : "Select a row"}}

// For arrays
{{Query1.data?.length > 0 ? Query1.data[0].name : "No data"}}
```

## Array and Data Issues

### Query Data is Not an Array

**Problem**: Array methods fail on query data.

**Solutions**:
```javascript
// Query data is usually an array, but check first
{{Array.isArray(Query1.data) ? Query1.data.length : 0}}

// Ensure data exists before mapping
{{(Query1.data || []).map(row => row.name)}}

// API responses might have nested data
{{API1.data.results || []}}
{{API1.data.data.items || []}}
```

### Empty Table After Query

**Problem**: Table shows no data even though query succeeds.

**Solutions**:
- Check Table Data property is set to `{{Query1.data}}`
- Verify query actually returns rows (check query response tab)
- For APIs, data might be nested: `{{API1.data.results}}`
- Check for column name mismatches between query and table

## Async/Await Issues

### Function Returns Promise Instead of Value

**Problem**: Binding shows Promise object instead of resolved value.

**Solutions**:
```javascript
// WRONG: Can't use await in bindings
{{await Query1.run()}}

// CORRECT: Use in JSObject and call the function
// JSObject
export default {
    async getData() {
        const result = await Query1.run();
        return result;
    }
}

// Binding (store result in widget or use query directly)
{{Query1.data}}
```

### Queries Running in Wrong Order

**Problem**: Dependent queries execute before their dependencies.

**Solutions**:
```javascript
// Use async/await for sequential execution
export default {
    async saveAndRefresh() {
        await InsertQuery.run();
        await FetchQuery.run();
        showAlert("Done!");
    }
}
```

## Widget Reference Issues

### Widget Not Found

**Problem**: `Widget1 is not defined` error.

**Solutions**:
- Check widget exists on the current page (not on another page)
- Verify exact widget name (check in widget properties panel)
- Widget names are auto-generated; don't assume names like `Input1`
- For modals, ensure modal is on the same page

## Performance Issues

### Page Loads Slowly

**Problem**: Page takes too long to load.

**Solutions**:
- Disable "Run on page load" for non-essential queries
- Add pagination to queries returning large datasets
- Use `LIMIT` in SQL queries
- Lazy-load data in tabs/accordions only when opened
