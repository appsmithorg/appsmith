import { LayoutSystemTypes } from "layoutSystems/types";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "../useLayoutSystemFeatures";

export const useMainContainerResizer = () => {
  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableMainContainerResizer] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER,
  ]);
  const layoutSystemType = useSelector(getLayoutSystemType);
  const isPreviewMode = useSelector(previewModeSelector);
  const canShowResizer =
    layoutSystemType === LayoutSystemTypes.ANVIL ? isPreviewMode : true;
  return { enableMainContainerResizer, canShowResizer };
};
