import {
  MEMBERS_SYNTAX_ERROR,
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

type modifyGroup = {
  id: string;
  displayName?: string;
  meta?: any;
};

export async function modifyGroup(
  baseEntity: string,
  id: string,
  attrObj: any,
  ctx: any,
): Promise<modifyGroup> {
  const action = "modifyGroup";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" id=${id} attrObj=${JSON.stringify(
      attrObj,
    )}`,
  );

  if (!attrObj.members) {
    attrObj.members = [];
  }
  if (!Array.isArray(attrObj.members)) {
    throw new Error(createMessage(MEMBERS_SYNTAX_ERROR, action, attrObj));
  }

  const body: any = {};
  let bodyForAddUsers: any = {};
  let bodyForRemoveUsers: any = {};
  if (attrObj.displayName) {
    body.name = attrObj.displayName;
  }
  if (attrObj.description) {
    body.description = attrObj.description;
  }

  const addUsers: any[] = [];
  const removeUsers: any[] = [];
  attrObj.members.forEach(function (el: any) {
    if (el.operation && el.operation === "delete") {
      // delete member from group
      removeUsers.push(el.value);
    } else {
      // add member to group/
      addUsers.push(el.value);
    }
  });
  bodyForAddUsers = { groupIds: [`${id}`], userIds: [] };
  bodyForRemoveUsers = { groupIds: [`${id}`], userIds: [] };
  if (addUsers.length > 0) {
    bodyForAddUsers.userIds.push(...addUsers);
  }
  if (removeUsers.length > 0) {
    bodyForRemoveUsers.userIds.push(...removeUsers);
  }
  if (addUsers.length > 0 && removeUsers.length > 0) {
    body.users = addUsers;
  }

  const methodForGroupDetails = "PUT";
  const methodForGroupUsers = "POST";
  const pathForGroupDetails = `${GROUP_PROVISION_ENDPOINT}/${id}`;
  const pathForAddUsers = `${GROUP_PROVISION_ENDPOINT}/invite`;
  const pathForRemoveUsers = `${GROUP_PROVISION_ENDPOINT}/removeUsers`;

  try {
    // name, description
    const response1 =
      ((addUsers.length > 0 && removeUsers.length > 0) ||
        (addUsers.length === 0 && removeUsers.length === 0)) &&
      (await doRequest(
        baseEntity,
        methodForGroupDetails,
        pathForGroupDetails,
        body,
        ctx,
      ));
    // remove users
    const response2 =
      removeUsers.length > 0 &&
      addUsers.length === 0 &&
      (await doRequest(
        baseEntity,
        methodForGroupUsers,
        pathForRemoveUsers,
        bodyForRemoveUsers,
        ctx,
      ));
    // invite users
    const response3 =
      addUsers.length > 0 &&
      removeUsers.length === 0 &&
      (await doRequest(
        baseEntity,
        methodForGroupUsers,
        pathForAddUsers,
        bodyForAddUsers,
        ctx,
      ));

    const isValidResponse1 = response1 ? validateResponse(response1) : true;
    const isValidResponse2 = response2 ? validateResponse(response2) : true;
    const isValidResponse3 = response3 ? validateResponse(response3) : true;

    if (isValidResponse1 && isValidResponse2 && isValidResponse3 && response1) {
      const data = response1.body.data;
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
