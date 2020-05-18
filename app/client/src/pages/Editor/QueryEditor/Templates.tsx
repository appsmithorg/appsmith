import {
  PLUGIN_PACKAGE_MONGO,
  PLUGIN_PACKAGE_POSTGRES,
} from "constants/QueryEditorConstants";

const Templates: Record<string, any> = {
  [PLUGIN_PACKAGE_MONGO]: {
    create: {
      insert: "users",
      documents: [
        {
          name: "John Smith",
          email: ["john@appsmith.com](mailto:%22john@appsmith.com)"],
          gender: "M",
        },
      ],
    },
    read: {
      find: "users",
      filter: { id: { $gte: 10 } },
      sort: { id: 1 },
      limit: 10,
    },
    delete: {
      delete: "users",
      deletes: [{ q: { id: 10 } }],
    },
    update: {
      update: "users",
      updates: [
        {
          q: { id: 10 },
          u: {
            name: "Updated Sam",
            email: ["updates@appsmith.com](mailto:%22updates@appsmith.com)"],
          },
        },
      ],
    },
  },
  [PLUGIN_PACKAGE_POSTGRES]: {
    create: `INSERT INTO users(
id, name, gender, avatar, email, address, role)
VALUES (?, ?, ?, ?, ?, ?, ?);`,
    read: "SELECT * FROM users ORDER BY id LIMIT 10",
    delete: `DELETE FROM users WHERE id=?`,
    update: `UPDATE users
Set status='APPROVED'
WHERE id=1;`,
  },
};

export default Templates;
