export enum CopyToAppEntityType {
  ACTION = "ACTION",
  JS_OBJECT = "JS_OBJECT",
}

// Identifies the source entity to be copied; used to open the modal.
export interface CopyToAppModalEntity {
  entityType: CopyToAppEntityType;
  entityId: string;
  entityName: string;
  sourcePageId: string;
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
