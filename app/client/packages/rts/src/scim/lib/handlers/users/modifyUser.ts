import {
  NO_RESOURCE_OR_ID_ERROR,
  UNSUPPORTED_SCIM_ATTRIBUTES,
  createMessage,
} from "@scim/constants/messages";
import {
  USER_PROVISION_ENDPOINT,
  doRequest,
  pluginName,
  scimGateway,
  validateResponse,
} from "@scim/lib/plugin-scim";

const validScimAttr: string[] = [];

type modifyResponse = {
  id?: string;
  userName?: string;
  active?: boolean;
  email?: string;
  meta?: any;
  displayName?: string;
};

export async function modifyUser(
  baseEntity: string,
  id: string,
  attrObj: {
    active?: boolean;
    emails?: { value: string }[];
    displayName?: string;
    userName?: string;
  },
  ctx: any,
): Promise<modifyResponse> {
  const action = "modifyUser";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" id=${id} attrObj=${JSON.stringify(
      attrObj,
    )}`,
  );

  const notValid = scimGateway?.notValidAttributes?.(attrObj, validScimAttr);
  if (notValid) {
    throw new Error(
      createMessage(
        UNSUPPORTED_SCIM_ATTRIBUTES,
        action,
        notValid,
        validScimAttr,
      ),
    );
  }

  const method = "PUT";
  const path = `${USER_PROVISION_ENDPOINT}/${id}`;
  const body: any = {};
  if (attrObj.active === true) {
    body.active = true;
  } else if (attrObj.active === false) {
    body.active = false;
    await scimGateway?.deleteUser?.(baseEntity, id, ctx);
    return;
  }
  if (attrObj.userName) {
    body.email = attrObj.userName;
  }
  if (attrObj.displayName || attrObj.displayName === "") {
    body.name = attrObj.displayName;
  }

  try {
    const response = await doRequest(baseEntity, method, path, body, ctx);
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      const data = response.body.data;

      if (
        !Object.keys(data).includes("resource") ||
        !Object.keys(data.resource).includes("id")
      ) {
        throw new Error(createMessage(NO_RESOURCE_OR_ID_ERROR));
      }

      return null;
    }
  } catch (err) {
    throw new Error(`${action} error: ${err.message}`);
  }
}
