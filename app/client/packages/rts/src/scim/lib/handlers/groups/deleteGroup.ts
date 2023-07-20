import {
  GROUP_PROVISION_ENDPOINT,
  doRequest,
  pluginName,
  scimGateway,
  validateResponse,
} from "@scim/lib/plugin-scim";

export async function deleteGroup(
  baseEntity: string,
  id: string,
  ctx: any,
): Promise<null> {
  const action = "deleteGroup";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" id=${id}`,
  );

  const method = "DELETE";
  const path = `${GROUP_PROVISION_ENDPOINT}/${id}`;
  const body = null;

  try {
    const response = await doRequest(baseEntity, method, path, body, ctx);
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      return null;
    }
  } catch (err) {
    throw new Error(`${action} error: ${err.message}`);
  }
}
