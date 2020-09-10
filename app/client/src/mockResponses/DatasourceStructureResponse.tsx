const dbStructure = [
  {
    type: "table",
    name: "users",
    templates: {
      CREATE: `INSERT INTO users
      (name, gender, email)
    VALUES
      (
        '{{ nameInput.text }}',
        '{{ genderDropdown.selectedOptionValue }}',
        '{{ nameInput.text }}'
      );
    `,
      DELETE: "DELETE FROM users WHERE id = '{{ usersTable.selectedRow.id }}';",
      SELECT: `SELECT * FROM users where role = '{{ roleDropdown.selectedOptionValue }}' ORDER BY id LIMIT 10;`,
      UPDATE: `UPDATE users
      SET status = 'APPROVED'
      WHERE id = '{{ usersTable.selectedRow.id }}';
    `,
    },
    columns: [
      {
        name: "id",
        type: "integer", // Can be any string, depends on the data types supported by the database.
        default: "nextval(...)", // Default value expression for this column, can be shown in the hint text. Might be null.
      },
      {
        name: "name",
        type: "varchar",
        default: null, // Null can mean that no default value was configured.
      },
      {
        name: "email",
        type: "varchar",
        default: null,
      },
      {
        name: "department_id",
        type: "integer",
        default: null,
      },
    ],
    keys: [
      {
        type: "primary", // This can only be "primary" or "foreign" currently.
        columns: [
          // A primary key can be defined on a combination of multiple columns.
          "id",
        ],
      },
      {
        type: "foreign",
        fromColumn: "department_id", // Name of column in *this* table.
        toColumn: "department.id", // Column name (prefixed with target table name) to which this key points to.
      },
    ],
    indexes: [
      {
        type: "unique", // This can only be "unique" or "normal" currently.
        columns: [
          // Indexes can be defined on a set of multiple columns.
          "name",
        ],
      },
      {
        type: "normal",
        columns: ["name"],
      },
    ],
  },
  {
    type: "table",
    name: "games",
    templates: {
      CREATE: `INSERT INTO users
        (name, gender, email)
      VALUES
        (
          '{{ nameInput.text }}',
          '{{ genderDropdown.selectedOptionValue }}',
          '{{ nameInput.text }}'
        );
      `,
      DELETE: "DELETE FROM users WHERE id = '{{ usersTable.selectedRow.id }}';",
      SELECT: `SELECT * FROM users where role = '{{ roleDropdown.selectedOptionValue }}' ORDER BY id LIMIT 10;`,
      UPDATE: `UPDATE users
        SET status = 'APPROVED'
        WHERE id = '{{ usersTable.selectedRow.id }}';
      `,
    },
    columns: [
      {
        name: "id",
        type: "integer", // Can be any string, depends on the data types supported by the database.
        default: "nextval(...)", // Default value expression for this column, can be shown in the hint text. Might be null.
      },
      {
        name: "name",
        type: "varchar",
        default: null, // Null can mean that no default value was configured.
      },
      {
        name: "publishDate",
        type: "date",
        default: null,
      },
      {
        name: "studio",
        type: "string",
        default: null,
      },
    ],
    keys: [
      {
        type: "primary", // This can only be "primary" or "foreign" currently.
        columns: [
          // A primary key can be defined on a combination of multiple columns.
          "id",
        ],
      },
      {
        type: "foreign",
        fromColumn: "department_id", // Name of column in *this* table.
        toColumn: "department.id", // Column name (prefixed with target table name) to which this key points to.
      },
    ],
    indexes: [
      {
        type: "unique", // This can only be "unique" or "normal" currently.
        columns: [
          // Indexes can be defined on a set of multiple columns.
          "name",
        ],
      },
      {
        type: "normal",
        columns: ["name"],
      },
    ],
  },
];

export default dbStructure;
