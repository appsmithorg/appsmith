import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";

import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

export const EDITOR_PATHS = [
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
];

export interface EditableTabPermissions {
  isFeatureEnabled: boolean;
  entity?: EntityItem;
}

export const getEditableTabPermissions = ({
  entity,
  isFeatureEnabled,
}: EditableTabPermissions) => {
  return getHasManageActionPermission(
    isFeatureEnabled,
    entity?.userPermissions || [],
  );
};
