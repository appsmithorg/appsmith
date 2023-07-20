export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

export const DUPLICATE_GROUP_ERROR = (name: string) =>
  `Conflict - AE-APP-4091: Duplicate key error: An object with the name "${name}" already exists. Please use a different name or reach out to Appsmith customer support to resolve this.`;
export const NO_RESOURCE_OR_ID_ERROR = () => "no resource or id returned";
export const NO_RESPONSE_ERROR = () =>
  "Did not get any response from the request.";
export const MANDATORY_IFELSE_ERROR = (action: string) =>
  `${action} error: mandatory if-else logic not fully implemented`;
export const ADVANCED_FILTERING_NOT_SUPPORTED = (
  action: string,
  filter: string,
) => `${action} error: not supporting advanced filtering: ${filter}`;
export const UNSUPPORTED_SCIM_ATTRIBUTES = (
  action: string,
  notValid: any,
  validScimAttr: any[],
) =>
  `${action} error: unsupported scim attributes: ${notValid} (supporting only these attributes: ${validScimAttr.toString()})`;
export const MEMBERS_SYNTAX_ERROR = (action: string, attrObj: any) =>
  `${action} error: ${JSON.stringify(
    attrObj,
  )} - correct syntax is { "members": [...] }`;
