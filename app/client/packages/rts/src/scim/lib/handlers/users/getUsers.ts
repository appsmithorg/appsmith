import {
  ADVANCED_FILTERING_NOT_SUPPORTED,
  MANDATORY_IFELSE_ERROR,
  createMessage,
} from "@scim/constants/messages";
import {
  USER_PROVISION_ENDPOINT,
  doRequest,
  pluginName,
  scimGateway,
  validateResponse,
} from "@scim/lib/plugin-scim";

type getResponse = {
  Resources: {
    id?: string;
    userName?: string;
    active?: boolean;
  }[];
  totalResults: number | null;
};

export async function getUsers(
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
): Promise<getResponse> {
  //
  // "getObj" = { attribute: <>, operator: <>, value: <>, rawFilter: <>, startIndex: <>, count: <> }
  // rawFilter is always included when filtering
  // attribute, operator and value are included when requesting unique object or simpel filtering
  // See comments in the "mandatory if-else logic - start"
  //
  // "attributes" is array of attributes to be returned - if empty, all supported attributes should be returned
  // Should normally return all supported user attributes having id and userName as mandatory
  // id and userName are most often considered as "the same" having value = <UserID>
  // Note, the value of returned 'id' will be used as 'id' in modifyUser and deleteUser
  // scimGateway will automatically filter response according to the attributes list
  //
  const action = "getUsers";
  scimGateway?.logger?.debug(
    `${pluginName}[${baseEntity}] handling "${action}" getObj=${
      getObj ? JSON.stringify(getObj) : ""
    } attributes=${attributes}`,
  );

  const method = "GET";
  let path: string;
  const body = null;

  // start mandatory if-else logic
  if (
    getObj.operator &&
    getObj.operator === "eq" &&
    ["id", "userName", "externalId"].includes(getObj.attribute)
  ) {
    // mandatory - unique filtering - single unique user to be returned - correspond to getUser() in versions < 4.x.x
    if (getObj.attribute === "id")
      // GET /Users/id
      path = `${USER_PROVISION_ENDPOINT}/${getObj.value}`;
    else if (getObj.attribute === "userName") {
      // GET /Users?email=bjensen@appsmith.com
      path = `${USER_PROVISION_ENDPOINT}?email=${getObj.value}`;
    }
  } else if (getObj.rawFilter) {
    // optional - advanced filtering having and/or/not - use getObj.rawFilter
    throw new Error(
      createMessage(ADVANCED_FILTERING_NOT_SUPPORTED, action, getObj.rawFilter),
    );
  } else {
    // mandatory - no filtering (!getObj.operator && !getObj.rawFilter) - all users to be returned - correspond to exploreUsers() in versions < 4.x.x
    const paginationParams = [];
    if (getObj.startIndex) {
      paginationParams.push(`startIndex=${getObj.startIndex}`);
    }
    if (getObj.count) {
      paginationParams.push(`count=${getObj.count}`);
    }
    path = `${USER_PROVISION_ENDPOINT}${
      paginationParams.length > 0 ? "?" + paginationParams.join("&") : ""
    }`;
  }
  // end mandatory if-else logic

  if (!path) throw new Error(createMessage(MANDATORY_IFELSE_ERROR, action));

  const ret: getResponse = {
    // itemsPerPage will be set by scimGateway
    Resources: [],
    totalResults: null,
  };

  try {
    const response = await doRequest(baseEntity, method, path, body, ctx);
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      const data = response.body.data;

      let contents = [];
      if (data && Object.keys(data).includes("resource")) {
        contents.push(data);
        ret.totalResults = 1;
      } else if (data && Object.keys(data).includes("content")) {
        contents = data.content;
        ret.totalResults = data.total;
      }

      contents.forEach(function (content) {
        const user = content.resource;
        const metadata = content.metadata;
        if (user.id) {
          const retObj = {
            id: user.id,
            userName: user.username ? user.username : undefined,
            email: user.email ? user.email : undefined,
            displayName: user.name ? user.name : undefined,
            active: true,
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
