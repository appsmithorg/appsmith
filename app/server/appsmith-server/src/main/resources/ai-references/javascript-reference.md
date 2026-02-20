# Appsmith JavaScript Reference

## Binding Syntax

Appsmith uses mustache-style bindings with double curly braces `{{ }}` to dynamically bind data to widget properties, query parameters, and other elements within the application. This allows for seamless integration of dynamic values throughout the application.

### Basic Bindings

```javascript
// Bind the text property of an input widget
{{Input1.text}}

// Bind the selected option value of a dropdown
{{Select1.selectedOptionValue}}

// Bind the selected row's id from a table
{{Table1.selectedRow.id}}
```

### Expression Bindings

```javascript
// Concatenate strings and variables
{{"Hello, " + Input1.text}}

// Perform arithmetic operations
{{Table1.selectedRow.id * 2}}

// Conditional logic
{{Checkbox1.isChecked ? "Checked" : "Unchecked"}}
```

### Theme Properties

Appsmith allows you to access theme properties to ensure consistency across your application.

```javascript
// Access the primary color from the theme
{{appsmith.theme.colors.primaryColor}}

// Access the border radius setting
{{appsmith.theme.borderRadius.appBorderRadius}}
```

### Dynamic Visibility and Validation

```javascript
// Make a widget visible based on a condition
{{Select1.selectedOptionValue === "Yes"}}

// Validate input length and content
{{Input1.text.length > 10 && /\d/.test(Input1.text) ? true : false}}

// Error message for validation
{{Input1.text.length > 10 || !/\d/.test(Input1.text) ? "Error: Length should be at least 10 characters and contain at least one digit" : ""}}
```

## Data Access Patterns

### Query and API Data

Accessing data from queries and APIs is straightforward in Appsmith. The `.data` property is commonly used to retrieve the results.

```javascript
// Access all data from a query
{{fetchUserData.data}}

// Access the first row of data from a query
{{fetchUserData.data[0]}}

// Map over query data to transform it
{{fetchUserData.data.map(user => ({label: user.name, value: user.id}))}}
```

### Widget References

Widgets in Appsmith can be referenced directly to access their properties.

```javascript
// Access the text of an input widget
{{Input1.text}}

// Access the selected option of a dropdown
{{Select1.selectedOptionValue}}

// Access the selected row in a table
{{Table1.selectedRow}}

// Access all selected rows in a multi-select table
{{Table1.selectedRows}}

// Check if a checkbox is checked
{{Checkbox1.isChecked}}
```

### JSObject Functions

JSObjects allow you to define reusable functions and variables.

```javascript
// Call a function defined in a JSObject
{{JsObject1.myFunction()}}

// Access a variable defined in a JSObject
{{JsObject1.myVariable}}
```

## Async Patterns

JavaScript in Appsmith is inherently asynchronous. Using `async/await` ensures that operations like API calls and database queries are handled correctly.

### Async Functions

```javascript
export default {
    async fetchData() {
        try {
            const data = await Api1.run();
            return data;
        } catch (error) {
            showAlert("Error fetching data", "error");
        }
    }
}
```

### Running Queries Programmatically

```javascript
// Execute a query and handle the result
const result = await Query1.run();
console.log(result);

// Execute a query with parameters
const user = await getUser.run({ id: Input1.text });
```

### Conditional Execution

```javascript
// Execute different queries based on a condition
{{ Select_Category.selectedOptionValue === 'Movies' ? fetchMovies.run() : fetchUsers.run(); }}
```

## Global APIs

Appsmith provides several built-in functions to perform common tasks like navigation, storing values, and displaying alerts.

### Navigation

```javascript
// Navigate to a different page
{{navigateTo('HomePage')}}

// Navigate with parameters
{{navigateTo('DetailsPage', { id: Table1.selectedRow.id }, 'SAME_WINDOW')}}
```

### Storing Values

```javascript
// Store a value in the app's store
{{storeValue('userName', Input1.text)}}

// Retrieve a stored value
{{appsmith.store.userName}}
```

### Alerts

```javascript
// Show an alert with a message
{{showAlert("Operation successful", "success")}}

// Show an alert after a delay
setTimeout(() => { showAlert("5 seconds have passed") }, 5000);
```

## Appsmith Object

The `appsmith` object provides access to various properties and methods that give context about the application and user.

### User Information

```javascript
// Access the current user's email
{{appsmith.user.email}}

// Access the current user's username
{{appsmith.user.username}}
```

### URL Parameters

```javascript
// Access query parameters from the URL
{{appsmith.URL.queryParams.id}}

// Access the full path of the URL
{{appsmith.URL.fullPath}}
```

### Store and Context

```javascript
// Access a value stored in the app's store
{{appsmith.store.userName}}

// Check if a stored value is null
{{appsmith.store.data == null ? false : true}}
```

## Error Handling

Proper error handling ensures that your application can gracefully handle unexpected situations.

### Try/Catch Patterns

```javascript
export default {
    async fetchData() {
        try {
            const data = await Api1.run();
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Failed to fetch data", "error");
        }
    }
}
```

### Workflow Error Handling

```javascript
export default {
    async executeWorkflow(data) {
        try {
            const response = await approvalRequest.run();
            if (response.resolution === "Approve") {
                await initiateRefund.run({ id: data.order_id });
                await notifyUser.run({ email: data.customer_email });
            }
        } catch (error) {
            console.error("Error executing workflow:", error);
        }
    }
}
```

## Common Patterns

### Form Submission

```javascript
// Submit form data to an API
export default {
    async submitForm() {
        try {
            const response = await submitApi.run({ data: Form1.data });
            showAlert("Form submitted successfully", "success");
        } catch (error) {
            showAlert("Error submitting form", "error");
        }
    }
}
```

### Data Transformation

```javascript
// Transform data before displaying
export default {
    formatUserData(users) {
        return users.map(user => ({
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email
        }));
    }
}
```

### Conditional Logic

```javascript
// Display a message based on a condition
{{Input1.text.length > 5 ? "Valid input" : "Input too short"}}
```

This comprehensive reference document provides a detailed overview of the various JavaScript patterns and practices within Appsmith, enabling developers to effectively utilize the platform's capabilities. By leveraging these patterns, you can build dynamic, responsive, and robust applications with ease.