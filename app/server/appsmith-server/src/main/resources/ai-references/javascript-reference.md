# Appsmith JavaScript Reference

## Binding Syntax

Appsmith uses mustache-style bindings with double curly braces `{{ }}` for dynamic values. Bindings can be used in widget properties, query parameters, and anywhere dynamic values are needed.

```javascript
// Basic binding to widget property
{{Input1.text}}

// Binding to query data
{{Query1.data}}

// Binding with expression
{{Table1.selectedRow.id * 2}}

// Conditional binding
{{Checkbox1.isChecked ? "Yes" : "No"}}
```

## Data Access Patterns

### Query and API Data
- `{{Query1.data}}` - Returns array of rows from database query
- `{{API1.data}}` - Returns response body from REST API
- `{{Query1.data[0]}}` - First row of query results
- `{{Query1.data.map(row => row.name)}}` - Transform query data

### Widget References
- `{{Input1.text}}` - Text input value
- `{{Select1.selectedOptionValue}}` - Selected dropdown value
- `{{Table1.selectedRow}}` - Currently selected table row
- `{{Table1.selectedRows}}` - All selected rows (multi-select)
- `{{Table1.tableData}}` - All data in table
- `{{Checkbox1.isChecked}}` - Boolean checkbox state
- `{{DatePicker1.selectedDate}}` - Selected date value

### JSObject Functions
- `{{JsObject1.myFunction()}}` - Call JSObject function
- `{{JsObject1.myVariable}}` - Access JSObject variable

## Async Patterns

All JavaScript code in Appsmith runs asynchronously. Use `async/await` in JSObjects.

```javascript
// JSObject async function
export default {
    async fetchAndProcess() {
        try {
            const result = await Query1.run();
            const processed = result.map(item => ({
                ...item,
                fullName: `${item.firstName} ${item.lastName}`
            }));
            return processed;
        } catch (error) {
            showAlert("Error: " + error.message, "error");
            return [];
        }
    }
}
```

### Running Queries Programmatically
```javascript
// With await
const data = await Query1.run();

// With parameters
const data = await Query1.run({ userId: 123 });

// With .then()
Query1.run().then(data => {
    showAlert("Loaded " + data.length + " records");
});
```

## Global APIs

Appsmith provides built-in functions available everywhere:

```javascript
// Alerts and modals
showAlert("Message", "success"); // types: success, info, warning, error
showModal("Modal1");
closeModal("Modal1");

// Navigation
navigateTo("PageName");
navigateTo("PageName", { param: "value" }); // with query params

// Storage (persists across sessions)
storeValue("key", value);
await storeValue("key", value); // async version

// Clipboard
copyToClipboard("text to copy");

// Download
download(data, "filename.csv", "text/csv");

// Reset widget
resetWidget("Input1", true); // true = reset children too
```

## Appsmith Object

Access application context through the global `appsmith` object:

```javascript
// Current user
appsmith.user.email
appsmith.user.name
appsmith.user.username

// URL and query parameters
appsmith.URL.queryParams.paramName
appsmith.URL.fullPath
appsmith.URL.host

// Persistent storage
appsmith.store.myKey

// App mode
appsmith.mode // "EDIT" or "PUBLISHED"

// Theme
appsmith.theme.colors.primaryColor
```

## Error Handling

Always wrap async operations in try/catch:

```javascript
export default {
    async saveData() {
        try {
            await InsertQuery.run();
            showAlert("Saved successfully!", "success");
            await DataQuery.run(); // Refresh data
        } catch (error) {
            console.error(error);
            showAlert("Save failed: " + error.message, "error");
        }
    }
}
```

## Common Patterns

### Form Submission
```javascript
async submitForm() {
    if (!Input1.text) {
        showAlert("Name is required", "warning");
        return;
    }
    await InsertQuery.run();
    resetWidget("Form1");
    closeModal("FormModal");
    await DataQuery.run();
}
```

### Conditional Logic in Bindings
```javascript
// Ternary for simple conditions
{{Table1.selectedRow ? Table1.selectedRow.name : "No selection"}}

// Nullish coalescing for defaults
{{Input1.text ?? "Default value"}}
```
