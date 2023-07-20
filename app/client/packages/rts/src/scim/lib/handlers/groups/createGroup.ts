import {
  DUPLICATE_GROUP_ERROR,
  NO_RESOURCE_OR_ID_ERROR,
  createMessage,
} from "@scim/constants/messages";
import {
  GROUP_PROVISION_ENDPOINT,
  doRequest,
  pluginName,
  scimGateway,
  validateResponse,
} from "@scim/lib/plugin-scim";

type createGroup = {
  id: string;
  displayName?: string;
  meta?: any;
};

export async function createGroup(
  baseEntity: string,
  groupObj: {
    displayName: string;
    description?: string;
    members?: { value: string }[];
  },
  ctx: any,
): Promise<createGroup> {
  const action = "createGroup";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" groupObj=${JSON.stringify(
      groupObj,
    )}`,
  );

  const method = "POST";
  const path = `${GROUP_PROVISION_ENDPOINT}`;
  const body = {
    name: groupObj.displayName,
    description: groupObj.description ? groupObj.description : undefined,
    users: groupObj.members ? groupObj.members.map((user) => user.value) : [],
  };

  try {
    const getGroupResponse = await scimGateway?.getGroups?.(
      baseEntity,
      { attribute: "displayName", operator: "eq", value: groupObj.displayName },
      [],
      ctx,
    );
    if (
      getGroupResponse?.totalResults > 0 &&
      getGroupResponse?.Resources?.length > 0
    ) {
      const err = new Error(
        createMessage(DUPLICATE_GROUP_ERROR, groupObj.displayName),
      );
      err.name = "uniqueness";
      throw err;
    }
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

      const retObj: createGroup = {
        id: data.resource.id,
        displayName: data.resource.name,
        meta: data.metadata,
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
