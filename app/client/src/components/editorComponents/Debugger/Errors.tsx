import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { getFilteredErrors } from "selectors/debuggerSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";
import ErrorLog from "./ErrorLog";

function Errors(props: { hasShortCut?: boolean }) {
  const errors = useSelector(getFilteredErrors);
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(currentUser);
  }, [currentUser?.email]);

  return <ErrorLog errors={errors} hasShortCut={props.hasShortCut} />;
}

export default Errors;
