import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

const titleCase = (str: string): string => {
  return str
    .split("/")
    .map(
      (segment) =>
        segment
          .replace(/([A-Z]+)([A-Z][a-z0-9])/g, "$1 $2") // Acronyms followed by words
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // Lowercase followed by uppercase
          .replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalize first letter
    )
    .join("/");
};

export const consistentStorybookTitle: TSESLint.RuleModule<"invalidTitle", []> =
  {
    defaultOptions: [],
    meta: {
      type: "problem",
      docs: {
        description:
          "Ensure Storybook titles in `export default` or meta objects are in Title Case",
        recommended: "error",
      },
      messages: {
        invalidTitle:
          'The Storybook title "{{ title }}" is not in Title Case. Suggested: "{{ suggestedTitle }}".',
      },
      schema: [], // No options
      fixable: "code", // Allows auto-fixing
    },

    create(context) {
      const filename = context.getFilename();
      const isStoryFile = filename.endsWith(".stories.tsx"); // Apply only to *.stories.tsx files

      if (!isStoryFile) {
        return {}; // No-op for non-story files
      }

      const validateTitle = (title: string, node: TSESTree.Node) => {
        const expectedTitle = titleCase(title);

        if (title !== expectedTitle) {
          context.report({
            node,
            messageId: "invalidTitle",
            data: {
              title,
              suggestedTitle: expectedTitle,
            },
            fix: (fixer) => fixer.replaceText(node, `"${expectedTitle}"`), // Use double quotes
          });
        }
      };

      return {
        ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration) {
          if (
            node.declaration.type === "ObjectExpression" &&
            node.declaration.properties.some(
              (prop) =>
                prop.type === "Property" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "title" &&
                prop.value.type === "Literal" &&
                typeof prop.value.value === "string",
            )
          ) {
            const titleProperty = node.declaration.properties.find(
              (prop) =>
                prop.type === "Property" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "title",
            ) as TSESTree.Property;

            const titleValue = titleProperty.value as TSESTree.Literal;

            if (typeof titleValue.value === "string") {
              validateTitle(titleValue.value, titleValue);
            }
          }
        },

        VariableDeclaration(node: TSESTree.VariableDeclaration) {
          node.declarations.forEach((declaration) => {
            if (
              declaration.init &&
              declaration.init.type === "ObjectExpression" &&
              declaration.init.properties.some(
                (prop) =>
                  prop.type === "Property" &&
                  prop.key.type === "Identifier" &&
                  prop.key.name === "title" &&
                  prop.value.type === "Literal" &&
                  typeof prop.value.value === "string",
              )
            ) {
              const titleProperty = declaration.init.properties.find(
                (prop) =>
                  prop.type === "Property" &&
                  prop.key.type === "Identifier" &&
                  prop.key.name === "title",
              ) as TSESTree.Property;

              const titleValue = titleProperty.value as TSESTree.Literal;

              if (typeof titleValue.value === "string") {
                validateTitle(titleValue.value, titleValue);
              }
            }
          });
        },
      };
    },
  };
