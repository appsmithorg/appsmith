import React from "react";
import { useSelector } from "react-redux";
import { commentThreadsSelector } from "../selectors";
import CommentCard from "../CommentCard";

type Props = {
  commentThreadIds: Array<string>;
};

const CommentThread = ({ commentThreadId }: { commentThreadId: string }) => {
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const { comments } = commentThread;

  if (!comments || comments.length === 0) return null;

  return <CommentCard comment={comments[0]} />;
};

const AppCommentsList = ({ commentThreadIds }: Props) => {
  return (
    <>
      {commentThreadIds.map((commentThreadId: string, index) => (
        <CommentThread key={index} commentThreadId={commentThreadId} />
      ))}
    </>
  );
};

export default AppCommentsList;
