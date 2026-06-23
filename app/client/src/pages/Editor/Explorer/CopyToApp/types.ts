export enum CopyToAppEntityType {
  ACTION = "ACTION",
  JS_OBJECT = "JS_OBJECT",
}

export interface CopyEntityToAppPayload {
  entityId: string;
  entityName: string;
  sourcePageId: string;
  targetWorkspaceId: string;
  targetApplicationId: string;
  targetApplicationName: string;
  targetPageId: string;
  targetPageName: string;
  onSuccess?: () => void;
}
