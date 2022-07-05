import { matchBuilderPath, matchViewerPath } from "constants/routes";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getCommentMode } from "selectors/commentsSelectors";

export const useCommentMode = () => {
  const commentMode = useSelector(getCommentMode);
  const isCommentMode = useRef<boolean>(false);
  useEffect(() => {
    const pathName = window.location.pathname;
    const onEditorOrViewerPage =
      matchBuilderPath(pathName) || matchViewerPath(pathName);

    if ((window as any).isCommentModeForced) isCommentMode.current = true;
    else isCommentMode.current = commentMode && !!onEditorOrViewerPage;
  }, [window.location.pathname, commentMode]);

  return isCommentMode.current;
};
