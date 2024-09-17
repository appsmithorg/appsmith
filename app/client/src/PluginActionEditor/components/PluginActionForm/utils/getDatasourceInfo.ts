import get from "lodash/get";
import type { Datasource } from "entities/Datasource";

export const getDatasourceInfo = (datasource: Datasource): string => {
  const info = [];
  const headers = get(datasource, "datasourceConfiguration.headers", []);
  const queryParameters = get(
    datasource,
    "datasourceConfiguration.queryParameters",
    [],
  );
  const authType = get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    "",
  ).toUpperCase();
  if (headers.length)
    info.push(`${headers.length} Header${headers.length > 1 ? "s" : ""}`);
  if (queryParameters.length)
    info.push(
      `${queryParameters.length} query parameters${
        queryParameters.length > 1 ? "s" : ""
      }`,
    );
  if (authType.length) info.push(authType);
  return info.join(" | ");
};
