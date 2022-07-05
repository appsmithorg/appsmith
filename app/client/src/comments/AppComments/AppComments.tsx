import { tailwindLayers } from "constants/Layers";
import React from "react";
import { useCommentMode } from "utils/hooks/useCommentMode";
import AppCommentsHeader from "./AppCommentsHeader";
import AppCommentThreads from "./AppCommentThreads";

function AppComments() {
  const isCommentMode = useCommentMode();

  if (!isCommentMode) return null;

  return (
    <div
      className={`absolute top-0 left-0 flex flex-col w-full h-full bg-white ${tailwindLayers.appComments}`}
    >
      <AppCommentsHeader />
      <AppCommentThreads />
    </div>
  );
}

export default AppComments;
