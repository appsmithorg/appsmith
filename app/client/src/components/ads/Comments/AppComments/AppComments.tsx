import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import AppCommentsList from "./AppCommentsList";
import styled from "styled-components";
import { commentModeSelector, applicationCommentsSelector } from "../selectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const Container = styled.div`
  width: ${(props) => props.theme.appComments.width};
  height: 100%;
`;

/**
 * Comments are stored as a map of refs (for example widgetIds)
 * Flatten to fetch all application comment threads
 */
const getCommentThreads = (threadsByRefMap: Record<string, Array<string>>) => {
  if (!threadsByRefMap) return;
  return Object.entries(threadsByRefMap).reduce(
    (res: Array<string>, [, threadIds]) => {
      return [...res, ...threadIds];
    },
    [],
  );
};

const AppComments = () => {
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const isCommentMode = useSelector(commentModeSelector);
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );

  const commentThreadIds = useMemo(
    () => getCommentThreads(appCommentThreadsByRefMap),
    [appCommentThreadsByRefMap],
  );

  if (!commentThreadIds) return null;

  return isCommentMode ? (
    <Container>
      <AppCommentsList commentThreadIds={commentThreadIds} />
    </Container>
  ) : null;
};

export default AppComments;
