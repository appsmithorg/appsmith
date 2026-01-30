import { routeChanged } from "actions/focusHistoryActions";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import type { AppsmithLocationState } from "utils/history";
import BetterbugsUtil from "utils/Analytics/betterbugs";

export default function RouteChangeListener() {
  const location = useLocation<AppsmithLocationState>();
  const dispatch = useDispatch();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const prevLocation = prevLocationRef;

    dispatch(routeChanged(location, prevLocation.current));
    BetterbugsUtil.updateMetadata();
    prevLocation.current = location;
  }, [location.pathname, location.hash]);

  return null;
}
