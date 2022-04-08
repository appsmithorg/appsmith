import React from "react";
import { useSelector } from "react-redux";
import { Redirect } from "react-router-dom";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";

export const requiresUnauth = (Component: React.ComponentType) => {
  function Wrapped(props: any) {
    const user = useSelector(getCurrentUser);
    if (!user) return null;
    if (user?.email && user?.email !== ANONYMOUS_USERNAME) {
      return <Redirect to={APPLICATIONS_URL} />;
    }
    return <Component {...props} />;
  }

  return Wrapped;
};

export const requiresAuth = (Component: React.ComponentType) => {
  return function Wrapped(props: any) {
    const user = useSelector(getCurrentUser);
    if (!user) return null;
    if (user?.email && user?.email !== ANONYMOUS_USERNAME) {
      return <Component {...props} />;
    }
    return <Redirect to={AUTH_LOGIN_URL} />;
  };
};
