import React from "react";
import { Redirect } from "react-router-dom";
import { useSelector } from "store";
import { APPLICATIONS_URL } from "constants/routes";

import "./App.css";
import "../node_modules/@blueprintjs/core/src/blueprint.scss";

export const App = () => {
  const currentUser = useSelector(state => state.ui.users.current);
  return currentUser ? <Redirect to={APPLICATIONS_URL} /> : null;
};

export default App;
