import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import type { IDEType } from "ee/IDE/Interfaces/IDETypes";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
} from "selectors/editorSelectors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useParentEntityInfo = (ideType: IDEType) => {
  const appId = useSelector(getCurrentApplicationId);
  const basePageId = useSelector(getCurrentBasePageId);

  return {
    editorId: appId || "",
    parentEntityId: basePageId || "",
    parentEntityType: ActionParentEntityType.PAGE,
  };
};
