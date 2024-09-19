import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "../useLayoutSystemFeatures";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

export const useMainContainerResizer = () => {
  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableMainContainerResizer] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_MAIN_CONTAINER_RESIZER,
  ]);
  const isAnvilLayout = useSelector(getIsAnvilLayout);
  const isPreviewMode = useSelector(previewModeSelector);
  const canShowResizer = isAnvilLayout ? isPreviewMode : true;

  return { enableMainContainerResizer, canShowResizer };
};
