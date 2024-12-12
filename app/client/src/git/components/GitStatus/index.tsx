import React from "react";
import DumbGitStatus from "./DumbGitStatus";
import { useGitContext } from "../GitContextProvider";

const initialState = {
  icon: "widget",
  message: "Page 1 modified",
  children: [
    {
      icon: "query",
      message: "2 queries modified",
      children: [
        {
          icon: "query",
          message: "Query 1 modified",
        },
        {
          icon: "query",
          message: "Query 2 modified",
        },
      ],
    },
  ],
};

function GitStatus() {
  const { fetchStatusLoading, status } = useGitContext();

  return (
    <DumbGitStatus
      isFetchStatusLoading={fetchStatusLoading}
      status={status}
      statusTransformer={() => initialState}
    />
  );
}

export default GitStatus;
