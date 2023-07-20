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

const validScimAttr = [];

type createResponse = {
  id?: string;
  userName?: string;
  active?: boolean;
  email?: string;
  meta?: any;
  displayName?: string;
};

export async function createUser(
  baseEntity: string,
  userObj: {
    active?: boolean;
    emails?: { value: string }[];
    displayName?: string;
    userName?: string;
  },
  ctx: any,
): Promise<createResponse> {
  const action = "createUser";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" userObj=${JSON.stringify(
      userObj,
    )}`,
  );

  const notValid = scimGateway?.notValidAttributes?.(userObj, validScimAttr);
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

  const method = "POST";
  const path = `${USER_PROVISION_ENDPOINT}`;
  const body = {
    email: userObj.userName ? userObj.userName : undefined,
    name: userObj.displayName ? userObj.displayName : undefined,
  };

  try {
    const response = await doRequest(baseEntity, method, path, body, ctx);
    const isValidResponse = await validateResponse(response);
    if (isValidResponse) {
      const data = response.body.data;

      if (
        !Object.keys(data).includes("resource") ||
        !Object.keys(data.resource).includes("id")
      ) {
        throw new Error(createMessage(NO_RESOURCE_OR_ID_ERROR));
      }

      const user = data.resource;
      const metadata = data.metadata;

      const retObj: createResponse = {
        id: user.id ? user.id : undefined,
        userName: user.username ? user.username : undefined,
        active: true,
        email: user.email ? user.email : undefined,
        displayName: user.name ? user.name : undefined,
        meta: metadata,
      };
      return retObj;
    }
  } catch (err) {
    if (err.name === "uniqueness") {
      throw err;
    } else {
      throw new Error(`${action} error: ${err.message}`);
    }
  }
}
