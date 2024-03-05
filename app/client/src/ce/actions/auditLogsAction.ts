/**
 * Code splitting helper for audit logs
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const logActionExecutionForAudit = (payload: {
  actionId: string;
  pageId: string;
  collectionId: string;
  actionName: string;
  pageName: string;
}) => {
  return {
    type: "",
  };
};
