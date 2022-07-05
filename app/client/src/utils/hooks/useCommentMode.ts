import { matchBuilderPath, matchViewerPath } from "constants/routes";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getCommentMode } from "selectors/commentsSelectors";

export const useCommentMode = () => {
  const commentMode = useSelector(getCommentMode);
  const [isCommentMode, setCommentMode] = useState(commentMode);
  useEffect(() => {
    const pathName = window.location.pathname;
    const onEditorOrViewerPage =
      matchBuilderPath(pathName) || matchViewerPath(pathName);

    if ((window as any).isCommentModeForced) setCommentMode(true);
    else setCommentMode(commentMode && !!onEditorOrViewerPage);
  }, [
    window.location.pathname,
    commentMode,
    (window as any).isCommentModeForced,
  ]);

  return isCommentMode;
};
