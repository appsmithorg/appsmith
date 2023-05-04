module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce wrapping of src attribute in getAssetUrl function for img, video, and audio elements",
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
          if (
            srcAttribute &&
            ["img", "video", "audio"].includes(parentTagName)
          ) {
            const srcValue =
              srcAttribute.value &&
              (srcAttribute.value.type === "Literal"
                ? srcAttribute.value.value
                : srcAttribute.value.expression.name);
            if (
              srcValue &&
              !srcValue.startsWith("{getAssetUrl(") &&
              !getAssetUrlRegex.test(srcValue)
            ) {
              context.report({
                node,
                message:
                  "The src attribute of {{tagName}} element must be wrapped in getAssetUrl function",
                data: {
                  tagName: parentTagName,
                },
                fix(fixer) {
                  const fixedSrcValue = `{getAssetUrl("${srcValue}")}`;
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
