// propertyPath -> "schema[0].children[0].fieldType"
// returns parentPropertyPath -> "schema[0].children[0]"
export const getParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -1).join(".");
};

// propertyPath -> "schema[0].children[0].props.options"
// returns grandParentPropertyPath -> "schema[0].children[0]"
export const getGrandParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -2).join(".");
};
