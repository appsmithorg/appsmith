import type { Property } from "entities/Action";
import getValidProperties from "./getValidProperties";

function getParamsCount(
  actionParams?: Property[],
  datasourceParams?: Property[],
) {
  const validActionParams = getValidProperties(actionParams);
  const validDatasourceParams = getValidProperties(datasourceParams);

  return validActionParams.length + validDatasourceParams.length;
}

export default getParamsCount;
