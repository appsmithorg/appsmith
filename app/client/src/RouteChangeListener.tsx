import { routeChanged } from "actions/focusHistoryActions";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import type { AppsmithLocationState } from "utils/history";

export default function RouteChangeListener() {
  const location = useLocation<AppsmithLocationState>();
  const dispatch = useDispatch();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const prevLocation = prevLocationRef;

    dispatch(routeChanged(location, prevLocation.current));
    prevLocation.current = location;
  }, [location.pathname, location.hash]);

  return null;
}
