import { flattenDSLByName, unflattenDSLByName } from "@shared/dsl";

export const getFlattenedDSLForGit = (nestedDSL) => {
  const gitFlattenedDSL = flattenDSLByName(nestedDSL);
  return gitFlattenedDSL;
};

export const getNestedDSLFromGit = (flattenedDSL) => {
  const { entities, result = "0" } = flattenedDSL;
  const nestedDSL = unflattenDSLByName(result, entities);
  return nestedDSL;
};
