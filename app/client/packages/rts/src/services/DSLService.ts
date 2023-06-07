import { flattenDSLByName, unflattenDSLByName } from "@shared/dsl";
import log from "loglevel";

export const getDSLForGit = (nestedDSL) => {
  const gitFlattenedDSL = flattenDSLByName(nestedDSL);
  log.debug("gitFlattenedDSL", gitFlattenedDSL);
  log.debug("nestedDSL", nestedDSL);
  return gitFlattenedDSL;
};

export const getNestedDSLFromGit = (flattenedDSLEntities) => {
  const nestedDSL = unflattenDSLByName("0", flattenedDSLEntities);
  return nestedDSL;
};
