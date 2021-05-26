import React from "react";
import { useSelector } from "react-redux";
import { commentModeSelector } from "selectors/commentsSelectors";
import AppCommentsHeader from "./AppCommentsHeader";
import AppCommentThreads from "./AppCommentThreads";
import Container from "./Container";

function AppComments() {
  const isCommentMode = useSelector(commentModeSelector);

  if (!isCommentMode) return null;

  return (
    <Container>
      <AppCommentsHeader />
      <AppCommentThreads />
    </Container>
  );
}

export default AppComments;
