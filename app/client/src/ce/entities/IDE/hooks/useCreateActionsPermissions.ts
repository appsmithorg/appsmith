import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { IDE_TYPE, type IDEType } from "ee/entities/IDE/constants";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useSelector } from "react-redux";
import { getPagePermissions } from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

export const useCreateActionsPermissions = (ideType: IDEType) => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);

  switch (ideType) {
    case IDE_TYPE.App: {
      return getHasCreateActionPermission(isFeatureEnabled, pagePermissions);
    }
    default: {
      return true;
    }
  }
};
