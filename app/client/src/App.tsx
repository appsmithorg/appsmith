import React from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "actions/authActions";

const App = () => {
  const dispatch = useDispatch();
  dispatch(getCurrentUser());
  return <div>Loading</div>;
};

export default App;
