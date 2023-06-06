import { flattenDSLByName, unflattenDSLByName } from "@shared/dsl";

export const getDSLForGit = (nestedDSL) => {
  const gitFlattenedDSL = flattenDSLByName(nestedDSL);
  return gitFlattenedDSL;
};

export const getNestedDSLFromGit = (flattenedDSLEntities) => {
  const nestedDSL = unflattenDSLByName("0", flattenedDSLEntities);
  return nestedDSL;
};
