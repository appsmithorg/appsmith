import { MAX_MODAL_WIDTH_FROM_MAIN_WIDTH } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getCanvasWidth } from "selectors/editorSelectors";

export const useModalWidth = () => {
  const mainCanvasWidth = useSelector(getCanvasWidth);
  const getMaxModalWidth = () => {
    return (mainCanvasWidth || 0) * MAX_MODAL_WIDTH_FROM_MAIN_WIDTH;
  };

  const getModalWidth = (width: number) => {
    return Math.min(getMaxModalWidth(), width);
  };
  return getModalWidth;
};
