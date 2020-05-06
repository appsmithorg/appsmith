import React from "react";
import { Redirect } from "react-router-dom";
import { APPLICATIONS_URL } from "constants/routes";

export const App = () => {
  return <Redirect to={APPLICATIONS_URL} />;
};

export default App;
