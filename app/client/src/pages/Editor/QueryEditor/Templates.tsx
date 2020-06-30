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
          name: "{{Input1.text}}",
          email: "{{Input2.text}}",
          gender: "{{Dropdown2.selectedOptionValue}}",
        },
      ],
    },
    read: {
      find: "users",
      filter: { id: { $gte: "{{Input1.text}}" } },
      sort: { id: 1 },
      limit: 10,
    },
    delete: {
      delete: "users",
      deletes: [{ q: { id: "{{Table1.selectedRow.id}}" } }],
    },
    update: {
      update: "users",
      updates: [
        {
          q: { id: "{{Table1.selectedRow.id}}" },
          u: {
            name: "{{Input1.text}}",
            email: "{{Input2.text}}",
          },
        },
      ],
    },
  },
  [PLUGIN_PACKAGE_POSTGRES]: {
    create: `INSERT INTO users(name, gender)
VALUES ('{{Dropdown1.selectedOptionValue}}', '{{Input2.text}}');`,
    read:
      "SELECT * FROM users where name like '%{{Input1.text}}%' ORDER BY id LIMIT 10",
    delete: `DELETE FROM users WHERE id={{Table1.selectedRow.id}}`,
    update: `UPDATE users
Set status={{Dropdown1.selectedOptionValue}}
WHERE id={{Table1.selectedRow.id}};`,
  },
};

export default Templates;
