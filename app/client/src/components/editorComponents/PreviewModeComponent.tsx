import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";

type Props = {
  children: React.ReactNode;
  isVisible?: boolean;
};

/**
 * render only visible components in preview mode
 */
function PreviewModeComponent({ children, isVisible }: Props) {
  const isPreviewMode = useSelector(previewModeSelector);

  if (isPreviewMode && !isVisible) {
    return null as any;
  } else {
    return children;
  }
}

export default PreviewModeComponent;
