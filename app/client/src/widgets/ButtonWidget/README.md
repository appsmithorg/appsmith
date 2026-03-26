# Button Widget

The Button widget is one of the most fundamental interactive components in Appsmith. It captures user intent and triggers actions based on that intent, making it essential for forms, navigation, and any interactive workflow.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Properties](#properties)
  - [Content Properties](#content-properties)
  - [General Properties](#general-properties)
  - [Validation Properties](#validation-properties)
  - [Form Settings](#form-settings)
  - [Style Properties](#style-properties)
- [Events](#events)
- [Methods](#methods)
- [Best Practices](#best-practices)
- [Common Use Cases](#common-use-cases)
- [Examples](#examples)

## Overview

Buttons are used to:
- Trigger API calls, queries, or JavaScript functions
- Submit forms
- Navigate between pages
- Execute custom actions

The Button widget supports various styling options, icons, Google reCAPTCHA integration, and can be configured to work seamlessly with Form widgets.

## Basic Usage

### Adding a Button

1. Drag a Button widget from the widget panel onto your canvas
2. Configure the **Label** property to set the button text
3. Add an **onClick** action to define what happens when clicked

### Simple Example

```
// Button configuration
Label: "Submit Form"
onClick: {{ Api1.run() }}
```

## Properties

### Content Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | string | `"Submit"` | The label displayed on the button |
| `onClick` | action | - | Action to execute when the button is clicked. Can be an API call, query, or JavaScript function |

### General Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tooltip` | string | - | Helper text shown on hover |
| `isVisible` | boolean | `true` | Controls the visibility of the widget |
| `isDisabled` | boolean | `false` | Disables clicks to this widget |
| `animateLoading` | boolean | `true` | Controls the loading animation state |

### Validation Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `googleRecaptchaKey` | string | - | Google reCAPTCHA site key for spam protection |
| `recaptchaType` | string | `"V3"` | Google reCAPTCHA version (`V2` or `V3`) |

### Form Settings

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disabledWhenInvalid` | boolean | `false` | Disables the button if the parent form is invalid |
| `resetFormOnClick` | boolean | `false` | Resets parent form fields after successful click action |

### Style Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `buttonVariant` | string | `"PRIMARY"` | Button style variant (`PRIMARY`, `SECONDARY`, `TERTIARY`) |
| `buttonColor` | string | Theme primary | Background color of the button |
| `iconName` | string | - | Icon to display on the button |
| `iconAlign` | string | `"left"` | Icon position (`left` or `right`) |
| `placement` | string | `"CENTER"` | Content alignment (`START`, `BETWEEN`, `CENTER`) |
| `borderRadius` | string | Theme default | Corner radius of the button |
| `boxShadow` | string | `"none"` | Shadow effect applied to the button |

## Events

The Button widget provides the following event:

### onClick

Triggered when the button is clicked. You can configure this to:
- Run an API or query
- Execute JavaScript code
- Navigate to a page
- Show a modal or alert

```javascript
// Example: Run multiple actions
{{ 
  Api1.run()
    .then(() => showAlert('Success!', 'success'))
    .catch(() => showAlert('Error!', 'error'))
}}
```

## Methods

You can programmatically interact with the Button widget using these methods:

### setVisibility(visibility: boolean)

Controls the visibility of the button.

```javascript
// Hide the button
Button1.setVisibility(false);

// Show the button
Button1.setVisibility(true);
```

### setDisabled(disabled: boolean)

Controls whether the button is disabled.

```javascript
// Disable the button
Button1.setDisabled(true);

// Enable the button
Button1.setDisabled(false);
```

### setLabel(label: string)

Updates the button's label text.

```javascript
Button1.setLabel("Processing...");
```

### setColor(color: string)

Changes the button's background color.

```javascript
Button1.setColor("#FF5733");
```

## Best Practices

### 1. Clear and Action-Oriented Labels

Use clear, concise labels that describe the action:

```
✅ Good: "Save Changes", "Submit Order", "Delete Item"
❌ Avoid: "Click Here", "Submit", "OK"
```

### 2. Appropriate Button Variants

Choose the right variant for the context:

- **PRIMARY**: Main actions (Submit, Save, Continue)
- **SECONDARY**: Secondary actions (Cancel, Back, Optional actions)
- **TERTIARY**: Tertiary actions (Less important links, Toggles)

### 3. Loading States

Handle loading states for async operations:

```javascript
// The button automatically shows loading state during action execution
onClick: {{ 
  Api1.run()
    .then(() => showAlert('Success!'))
}}
```

### 4. Error Handling

Always handle potential errors:

```javascript
onClick: {{
  Api1.run()
    .then(() => {
      showAlert('Data saved successfully!', 'success');
      navigateTo('Dashboard');
    })
    .catch((error) => {
      showAlert('Failed to save: ' + error.message, 'error');
    })
}}
```

### 5. Form Integration

When using buttons inside forms:

- Enable `disabledWhenInvalid` to prevent invalid submissions
- Use `resetFormOnClick` to clear the form after success

### 6. Accessibility

- Provide meaningful `tooltip` text for complex actions
- Ensure color contrast meets accessibility standards
- Don't rely solely on color to convey meaning

## Common Use Cases

### 1. Form Submission

```javascript
// Button in a form
Label: "Submit"
onClick: {{
  CreateUserAPI.run()
    .then(() => {
      showAlert('User created successfully!', 'success');
      resetWidget('Form1');
    })
    .catch((error) => {
      showAlert('Error: ' + error.message, 'error');
    })
}}
```

### 2. API Call with Loading State

```javascript
// Button triggers API call
Label: "Fetch Data"
onClick: {{ GetUsersAPI.run() }}
// The button automatically shows loading spinner during execution
```

### 3. Conditional Navigation

```javascript
// Navigate based on condition
onClick: {{
  if (User.role === 'admin') {
    navigateTo('AdminDashboard');
  } else {
    navigateTo('UserDashboard');
  }
}}
```

### 4. Multiple Actions Sequence

```javascript
// Execute actions in sequence
onClick: {{
  SaveDataAPI.run()
    .then(() => SendEmailAPI.run())
    .then(() => LogActivityAPI.run())
    .then(() => {
      showAlert('All actions completed!', 'success');
    })
    .catch((error) => {
      showAlert('Something went wrong: ' + error.message, 'error');
    })
}}
```

### 5. Delete Confirmation

```javascript
// Show confirmation before destructive action
Label: "Delete"
buttonVariant: "SECONDARY" // or style with danger color
onClick: {{
  showModal('DeleteConfirmModal');
}}
```

### 6. Dynamic Button State

```javascript
// Disable button based on table selection
isDisabled: {{ Table1.selectedRow == null }}

// Dynamic label based on state
text: {{ EditMode ? "Update" : "Create" }}

// Dynamic color based on status
buttonColor: {{ Status.value === 'active' ? '#4CAF50' : '#9E9E9E' }}
```

### 7. Google reCAPTCHA Integration

For spam protection on public forms:

1. Set `googleRecaptchaKey` to your reCAPTCHA site key
2. Choose `recaptchaType` (`V2` or `V3`)
3. Access the token via `Button1.recaptchaToken` in your API call

```javascript
onClick: {{
  SubmitFormAPI.run({
    recaptchaToken: Button1.recaptchaToken
  })
}}
```

## Examples

### Example 1: Login Button

```javascript
// Widget Configuration
text: "Sign In"
buttonVariant: "PRIMARY"
onClick: {{
  LoginAPI.run({
    username: InputUsername.text,
    password: InputPassword.text
  })
  .then((response) => {
    if (response.success) {
      storeValue('token', response.token);
      navigateTo('Dashboard');
    } else {
      showAlert('Invalid credentials', 'error');
    }
  })
  .catch(() => {
    showAlert('Login failed. Please try again.', 'error');
  })
}}
```

### Example 2: Export Data Button

```javascript
// Widget Configuration
text: "Export to CSV"
iconName: "download"
iconAlign: "left"
buttonVariant: "SECONDARY"
onClick: {{
  ExportDataAPI.run()
    .then((data) => {
      download(data.csvContent, 'export.csv', 'text/csv');
      showAlert('Export complete!', 'success');
    })
}}
```

### Example 3: Conditional Action Button

```javascript
// Widget Configuration
text: {{ TableRow.isSelected ? "Edit Selected" : "Select an Item" }}
isDisabled: {{ !TableRow.isSelected }}
buttonVariant: {{ TableRow.isSelected ? "PRIMARY" : "SECONDARY" }}
onClick: {{
  navigateTo('EditPage', { id: TableRow.selectedRow.id });
}}
```

### Example 4: Bulk Action Button

```javascript
// Widget Configuration
text: {{ "Delete " + Table1.selectedRows.length + " items" }}
isDisabled: {{ Table1.selectedRows.length === 0 }}
buttonColor: "#DC3545"
onClick: {{
  showModal('ConfirmBulkDeleteModal');
}}
```

## Related Widgets

- [IconButton Widget](../IconButtonWidget) - Button with icon only
- [ButtonGroup Widget](../ButtonGroupWidget) - Group of related buttons
- [Form Widget](../FormWidget) - Container for form inputs

## External Resources

- [Official Documentation](https://docs.appsmith.com/widget-reference/button)
- [Button Widget Tutorial](https://docs.appsmith.com/tutorials/button-widget)

---

For more information about contributing to Appsmith, see the [Contributing Guide](../../../../CONTRIBUTING.md).