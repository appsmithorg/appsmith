import { MAX_MODAL_WIDTH_FROM_MAIN_WIDTH } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getCanvasWidth } from "selectors/editorSelectors";

export const useMaxModalWidth = () => {
  const mainCanvasWidth = useSelector(getCanvasWidth);

  return (mainCanvasWidth || 0) * MAX_MODAL_WIDTH_FROM_MAIN_WIDTH;
};
export const useModalWidth = () => {
  const maxModalWidth = useMaxModalWidth();
  const getModalWidth = (width = 0) => {
    return Math.min(maxModalWidth, width);
  };

  return getModalWidth;
};
