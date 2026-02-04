# Appsmith GraphQL Reference

## Query Setup

In Appsmith, setting up a GraphQL query involves defining the query body and specifying any variables needed to execute the query dynamically. This setup allows you to interact with GraphQL APIs efficiently and flexibly.

### Query Body

The query body is where you define the GraphQL operation you want to perform. This can be a query to fetch data or a mutation to modify data.

Example:
```graphql
query GetUsers($limit: Int, $offset: Int) {
  users(limit: $limit, offset: $offset) {
    id
    name
    email
    createdAt
  }
}
```
- **GetUsers**: The name of the query.
- **$limit, $offset**: Variables used to control pagination.
- **users**: The field being queried, which returns a list of users.

### Variables Section

Variables are defined as a JSON object and can be dynamically set using Appsmith's `{{ }}` syntax. This allows you to bind widget data or other dynamic values to your GraphQL queries.

Example:
```json
{
  "limit": {{Table1.pageSize}},
  "offset": {{(Table1.pageNo - 1) * Table1.pageSize}}
}
```
- **limit**: Binds to the page size of a table widget.
- **offset**: Calculates the offset based on the current page number and page size.

## Query Patterns

GraphQL queries can be simple or complex, depending on the data requirements. Below are common patterns used in Appsmith.

### Simple Query

A simple query fetches data without any variables or conditions.

Example:
```graphql
query {
  users {
    id
    name
    email
  }
}
```
- Fetches all users with their `id`, `name`, and `email`.

### Query with Variables

Variables allow you to parameterize queries, making them dynamic and reusable.

Example:
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    orders {
      id
      total
    }
  }
}
```
Variables:
```json
{
  "id": {{Table1.selectedRow.id}}
}
```
- **GetUser**: Fetches a specific user and their orders using an `id` variable.

### Query with Filtering

Filtering allows you to narrow down the results based on certain criteria.

Example:
```graphql
query SearchUsers($searchTerm: String, $status: UserStatus) {
  users(where: { name_contains: $searchTerm, status: $status }) {
    id
    name
    email
    status
  }
}
```
Variables:
```json
{
  "searchTerm": {{Input_Search.text || null}},
  "status": {{Select_Status.selectedOptionValue || null}}
}
```
- Filters users by name and status using input and select widgets.

## Mutations

Mutations in GraphQL are used to modify data on the server. They can create, update, or delete records.

### Create Mutation

To add new data, use a create mutation.

Example:
```graphql
mutation CreateUser($name: String!, $email: String!, $date_of_birth: String!) {
  createUser(name: $name, email: $email, date_of_birth: $date_of_birth) {
    id
    name
    email
    date_of_birth
  }
}
```
- **CreateUser**: Adds a new user with the specified details.

### Update Mutation

Updating existing data requires an update mutation.

Example:
```graphql
mutation UpdateUser($id: Int!, $name: String, $email: String, $date_of_birth: String) {
  updateUser(id: $id, name: $name, email: $email, date_of_birth: $date_of_birth) {
    id
    name
    email
    date_of_birth
  }
}
```
- **UpdateUser**: Modifies an existing user's details based on their `id`.

### Delete Mutation

To remove data, use a delete mutation.

Example:
```graphql
mutation DeleteUser($id: Int!) {
  deleteUser(id: $id) {
    id
    name
    email
    date_of_birth
  }
}
```
- **DeleteUser**: Deletes a user identified by `id`.

## Pagination

Pagination is crucial for handling large datasets efficiently. GraphQL supports both offset-based and cursor-based pagination.

### Offset-Based Pagination

Offset-based pagination uses a limit and offset to fetch data in chunks.

Example:
```graphql
query GetProducts($limit: Int!, $offset: Int!) {
  products(limit: $limit, offset: $offset) {
    id
    name
    price
  }
  productsCount
}
```
Variables:
```json
{
  "limit": {{Table1.pageSize}},
  "offset": {{(Table1.pageNo - 1) * Table1.pageSize}}
}
```
- Fetches a specific number of products starting from a calculated offset.

### Cursor-Based Pagination

Cursor-based pagination uses cursors to navigate through data.

Example:
```graphql
query GetProducts($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    edges {
      node {
        id
        name
        price
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```
Variables:
```json
{
  "first": 10,
  "after": {{appsmith.store.lastCursor || null}}
}
```
- Fetches the first set of products after a given cursor, supporting infinite scrolling.

## Error Handling

Handling errors in GraphQL queries and mutations is essential for robust applications. Appsmith provides mechanisms to manage errors gracefully.

### Basic Error Handling

GraphQL errors can be captured and displayed to users or logged for debugging.

Example:
```javascript
{
  "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
  "variables": { "id": {{Input_UserId.text}} }
}
```
- Use Appsmith's error handling features to display messages or logs.

### Custom Error Messages

You can customize error messages based on the type of error received.

Example:
```javascript
if (response.errors) {
  showAlert("Error fetching data: " + response.errors[0].message, "error");
}
```
- Displays a custom alert with the error message from the GraphQL response.

### Retry Logic

Implement retry logic for transient errors to improve reliability.

Example:
```javascript
let retries = 3;
while (retries > 0) {
  try {
    // Execute GraphQL query
    break;
  } catch (error) {
    retries--;
    if (retries === 0) {
      showAlert("Failed to fetch data after multiple attempts", "error");
    }
  }
}
```
- Attempts to retry the query a specified number of times before failing.

By understanding and utilizing these patterns and techniques, you can effectively build and manage GraphQL-based applications in Appsmith. This reference guide provides a comprehensive overview of setting up queries, handling mutations, implementing pagination, and managing errors, ensuring you can leverage the full power of GraphQL within your Appsmith applications.