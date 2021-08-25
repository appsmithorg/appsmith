import React from "react";
import { useSelector } from "react-redux";
import { getIsGitRepoSetup } from "selectors/gitSyncSelectors";
import InitialState from "./InitialState";

export default function Deploy() {
  const isGitRepoSetup = useSelector(getIsGitRepoSetup);
  return !isGitRepoSetup ? <InitialState /> : null;
}
