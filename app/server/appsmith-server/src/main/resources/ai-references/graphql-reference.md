# Appsmith GraphQL Reference

## GraphQL Query Setup

In Appsmith, GraphQL queries are configured with:
1. **Body** - The GraphQL query or mutation
2. **Variables** - JSON object with variable values (supports `{{ }}` bindings)

## Basic Query Structure

### Query Body
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

### Variables Section
```json
{
  "limit": {{Table1.pageSize}},
  "offset": {{(Table1.pageNo - 1) * Table1.pageSize}}
}
```

## Query Patterns

### Simple Query
```graphql
query {
  users {
    id
    name
    email
  }
}
```

### Query with Variables
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

### Query with Filtering
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

## Pagination Patterns

### Offset-Based Pagination
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

### Cursor-Based Pagination
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

## Mutation Patterns

### Create Mutation
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```

Variables:
```json
{
  "input": {
    "name": {{Input_Name.text}},
    "email": {{Input_Email.text}},
    "role": {{Select_Role.selectedOptionValue}}
  }
}
```

### Update Mutation
```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    updatedAt
  }
}
```

Variables:
```json
{
  "id": {{Table1.selectedRow.id}},
  "input": {
    "name": {{Input_Name.text}},
    "email": {{Input_Email.text}}
  }
}
```

### Delete Mutation
```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    id
    success
  }
}
```

Variables:
```json
{
  "id": {{Table1.selectedRow.id}}
}
```

## Working with Nested Data

### Query Nested Relations
```graphql
query GetOrderWithDetails($orderId: ID!) {
  order(id: $orderId) {
    id
    createdAt
    total
    customer {
      id
      name
      email
    }
    items {
      id
      product {
        name
        price
      }
      quantity
    }
  }
}
```

### Accessing Nested Data in Widgets
```javascript
// Table data from nested query
{{GetOrdersQuery.data.orders}}

// Access nested field
{{GetOrderQuery.data.order.customer.name}}

// Map nested items
{{GetOrderQuery.data.order.items.map(item => item.product.name)}}
```

## Fragments for Reusable Fields

```graphql
fragment UserFields on User {
  id
  name
  email
  avatar
}

query GetUsers {
  users {
    ...UserFields
  }
}

query GetCurrentUser {
  me {
    ...UserFields
    preferences {
      theme
      notifications
    }
  }
}
```

## Error Handling

GraphQL returns errors in a standard format:

```javascript
// In JSObject
async function fetchData() {
  try {
    const result = await GraphQLQuery.run();
    if (result.errors) {
      showAlert(result.errors[0].message, "error");
      return null;
    }
    return result.data;
  } catch (error) {
    showAlert("Network error", "error");
    return null;
  }
}
```

## Best Practices

1. **Use variables** instead of string interpolation for dynamic values
2. **Request only needed fields** to minimize response size
3. **Use fragments** for commonly requested field sets
4. **Handle both network errors and GraphQL errors** in your code
5. **Use meaningful operation names** (e.g., `GetUsers`, `CreateOrder`) for debugging
6. **Leverage pagination** for large datasets to improve performance
