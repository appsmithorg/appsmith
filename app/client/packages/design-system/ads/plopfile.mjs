export default function (plop) {
  plop.addHelper("capitalize", (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  });
  // component generator
  plop.setGenerator("component", {
    description: "Component generator",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Enter component name",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.tsx",
        templateFile: "plop-templates/component.tsx.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/index.ts",
        templateFile: "plop-templates/index.ts.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.stories.tsx",
        templateFile: "plop-templates/stories.tsx.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.styles.tsx",
        templateFile: "plop-templates/styles.tsx.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.types.ts",
        templateFile: "plop-templates/types.ts.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.constants.ts",
        templateFile: "plop-templates/constants.ts.hbs",
      },
      {
        type: "add",
        path: "src/{{capitalize name}}/{{capitalize name}}.mdx",
        templateFile: "plop-templates/component.mdx.hbs",
      },
    ],
  });
}
