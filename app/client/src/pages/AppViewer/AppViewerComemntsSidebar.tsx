import React from "react";
import { useSelector } from "react-redux";

import AppComments from "comments/AppComments/AppComments";
import { commentModeSelector } from "selectors/commentsSelectors";

function AppViewerCommentsSidebar() {
  const isCommentMode = useSelector(commentModeSelector);

  // only renders the sidebar in comments mode
  if (!isCommentMode) return null;

  return (
    <div className="relative flex border-r border-gray-200 z-3">
      <div className="h-full p-0 overflow-y-auto w-80">
        <AppComments />
      </div>
    </div>
  );
}

export default AppViewerCommentsSidebar;
