import { flattenDSLByName, unflattenDSLByName } from "@shared/dsl";
import log from "loglevel";

export const getFlattenedDSLForGit = (nestedDSL) => {
  const gitFlattenedDSL = flattenDSLByName(nestedDSL);
  log.debug("gitFlattenedDSL", gitFlattenedDSL);
  log.debug("nestedDSL", nestedDSL);
  return gitFlattenedDSL;
};

export const getNestedDSLFromGit = (flattenedDSL) => {
  const { entities, result = "0" } = flattenedDSL;
  const nestedDSL = unflattenDSLByName(result, entities);
  return nestedDSL;
};
