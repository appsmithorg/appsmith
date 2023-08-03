import {
  ADVANCED_FILTERING_NOT_SUPPORTED,
  MANDATORY_IFELSE_ERROR,
  createMessage,
} from "@scim/constants/messages";
import {
  GROUP_PROVISION_ENDPOINT,
  doRequest,
  pluginName,
  scimGateway,
  validateResponse,
} from "@scim/lib/plugin-scim";

type getGroups = {
  Resources: {
    id?: string;
    displayName?: string;
    description?: string;
    members?: { value: string; type: string }[];
  }[];
  totalResults: number | null;
};

export async function getGroups(
  baseEntity: string,
  getObj: {
    attribute?: string;
    operator?: string;
    value?: string;
    rawFilter?: string;
    startIndex?: number;
    count?: number;
  },
  attributes: string[],
  ctx: any,
): Promise<getGroups> {
  //
  // "getObj" = { attribute: <>, operator: <>, value: <>, rawFilter: <>, startIndex: <>, count: <> }
  // rawFilter is always included when filtering
  // attribute, operator and value are included when requesting unique object or simpel filtering
  // See comments in the "mandatory if-else logic - start"
  //
  // "attributes" is array of attributes to be returned - if empty, all supported attributes should be returned
  // Should normally return all supported group attributes having id, displayName and members as mandatory
  // id and displayName are most often considered as "the same" having value = <GroupName>
  // Note, the value of returned 'id' will be used as 'id' in modifyGroup and deleteGroup
  // scimGateway will automatically filter response according to the attributes list
  //
  const action = "getGroups";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" getObj=${
      getObj ? JSON.stringify(getObj) : ""
    } attributes=${attributes}`,
  );

  const method = "GET";
  let path: string;
  const body = null;

  // mandatory if-else logic - start
  if (getObj.operator) {
    if (
      getObj.operator === "eq" &&
      ["id", "displayName"].includes(getObj.attribute)
    ) {
      // mandatory - unique filtering - single unique user to be returned - correspond to getUser() in versions < 4.x.x
      if (getObj.attribute === "id")
        path = `${GROUP_PROVISION_ENDPOINT}/${getObj.value}`;
      // GET /Users/bjensen
      else if (getObj.attribute === "displayName") {
        // GET /Users?displayName=test
        path = `${GROUP_PROVISION_ENDPOINT}?${getObj.attribute}=${getObj.value}`;
      }
    } else if (
      getObj.operator === "eq" &&
      getObj.attribute === "members.value"
    ) {
      // mandatory - return all groups the user 'id' (getObj.value) is member of - correspond to getGroupMembers() in versions < 4.x.x
      // Resources = [{ id: <id-group>> , displayName: <displayName-group>, members [{value: <id-user>}] }]
      path = `${GROUP_PROVISION_ENDPOINT}?userId=${getObj.value}`;
    }
  } else if (getObj.rawFilter) {
    // optional - advanced filtering having and/or/not - use getObj.rawFilter
    throw new Error(
      createMessage(ADVANCED_FILTERING_NOT_SUPPORTED, action, getObj.rawFilter),
    );
  } else {
    // mandatory - no filtering (!getObj.operator && !getObj.rawFilter) - all groups to be returned - correspond to exploreGroups() in versions < 4.x.x
    const paginationParams = [];
    if (getObj.startIndex) {
      paginationParams.push(`"startIndex="${getObj.startIndex}`);
    }
    if (getObj.count) {
      paginationParams.push(`"count="${getObj.count}`);
    }
    path = `${GROUP_PROVISION_ENDPOINT}${
      paginationParams.length > 0 ? "?" + paginationParams.join("&") : ""
    }`;
  }
  // mandatory if-else logic - end

  if (!path) throw new Error(createMessage(MANDATORY_IFELSE_ERROR, action));

  const ret: getGroups = {
    // itemsPerPage will be set by scimGateway
    Resources: [],
    totalResults: null,
  };

  try {
    const response = await doRequest(baseEntity, method, path, body, ctx);
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      const data = response.body.data;
      let groups = [];

      if (data && Object.keys(data).includes("resource")) {
        groups.push(data);
        ret.totalResults = 1;
      } else if (data && Object.keys(data).includes("content")) {
        groups = data.content;
        ret.totalResults = data.total;
      }

      groups.forEach(function (content) {
        const group = content.resource;
        const metadata = content.metadata;
        if (group.id) {
          const groupMembers = Array.isArray(group.users)
            ? group.users.map((user) => ({
                value: user,
                type: "User",
              }))
            : undefined;
          const retObj = {
            id: group.id,
            displayName: group.name,
            description: group.description,
            members: groupMembers,
            meta: metadata,
          };
          ret.Resources.push(retObj);
        }
      });
      return ret;
    }
  } catch (err) {
    throw new Error(`${action} error: ${err.message}`);
  }
}
