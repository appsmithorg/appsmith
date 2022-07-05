import React from "react";

import AppComments from "comments/AppComments/AppComments";
import { useCommentMode } from "utils/hooks/useCommentMode";

function AppViewerCommentsSidebar() {
  const isCommentMode = useCommentMode();

  // only renders the sidebar in comments mode
  if (!isCommentMode) return null;

  return (
    <div className="relative flex border-r border-gray-200 z-[3]">
      <div className="h-full p-0 overflow-y-auto w-80">
        <AppComments />
      </div>
    </div>
  );
}

export default AppViewerCommentsSidebar;
