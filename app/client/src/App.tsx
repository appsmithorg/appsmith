import React from "react";
import { Redirect } from "react-router-dom";
import { USER_AUTH_URL } from "constants/routes";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "actions/userActions";

export const App = () => {
  const dispatch = useDispatch();
  dispatch(getCurrentUser());
  return <Redirect to={USER_AUTH_URL} />;
};

export default App;
