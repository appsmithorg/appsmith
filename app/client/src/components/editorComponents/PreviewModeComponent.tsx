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
function PreviewModeComponent({
  children,
  isVisible,
}: Props): React.ReactElement {
  const isPreviewMode = useSelector(previewModeSelector);
  if (!isPreviewMode || isVisible) return children as React.ReactElement;
  else return <div />;
}

export default PreviewModeComponent;
