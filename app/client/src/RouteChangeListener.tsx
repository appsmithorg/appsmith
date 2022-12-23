import { routeChanged } from "actions/focusHistoryActions";
import React from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppsmithLocationState } from "utils/history";

export default function RouteChangeListener() {
  const location = useLocation<AppsmithLocationState>();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(routeChanged(location));
  }, [location.pathname, location.hash]);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return null;
}
