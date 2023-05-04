module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce wrapping of src attribute in getAssetUrl function in all elements which have src to support Airgap.",
      category: "Possible Errors",
      recommended: true,
    },
    schema: [],
    fixable: "code",
  },

  create(context) {
    const getAssetUrlRegex = /^getAssetUrl$/;

    return {
      JSXOpeningElement(node) {
        if (node.name) {
          const parentTagName = node.name?.name;
          const srcAttribute = node.attributes.find(
            (attr) => attr.name?.name === "src",
          );
          if (srcAttribute) {
            const srcValue =
              srcAttribute.value &&
              (srcAttribute.value.type === "Literal"
                ? srcAttribute.value.value
                : srcAttribute.value.expression?.name ||
                  srcAttribute.value.expression?.callee?.name ||
                  (srcAttribute.value.expression?.type === "CallExpression" &&
                    `"${context
                      .getSourceCode()
                      .getText(srcAttribute.value.expression)}"`) ||
                  srcAttribute.value.expression?.name ||
                  srcAttribute.value.expression?.value);
            if (
              srcValue &&
              !srcValue.startsWith("{getAssetUrl(") &&
              !getAssetUrlRegex.test(srcValue)
            ) {
              context.report({
                node,
                message:
                  "The src attribute of {{tagName}} element must be wrapped in getAssetUrl function to support Airgap.",
                data: {
                  tagName: parentTagName,
                },
                fix(fixer) {
                  let fixedSrcValue;
                  if (
                    srcValue.startsWith("http://") ||
                    srcValue.startsWith("https://")
                  ) {
                    fixedSrcValue = `{getAssetUrl("${srcValue}")}`;
                  } else if (
                    srcAttribute.value.expression?.type === "CallExpression"
                  ) {
                    fixedSrcValue = `{getAssetUr(${srcValue}())}`;
                  } else {
                    fixedSrcValue = `{getAssetUrl(${srcValue})}`;
                  }
                  return fixer.replaceText(srcAttribute.value, fixedSrcValue);
                },
              });
            }
          }
        }
      },
    };
  },
};
