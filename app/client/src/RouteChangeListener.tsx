import {
  browserHistoryPopped,
  routeChanged,
} from "actions/focusHistoryActions";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import history, { type AppsmithLocationState } from "utils/history";

export default function RouteChangeListener() {
  const location = useLocation<AppsmithLocationState>();
  const dispatch = useDispatch();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const prevLocation = prevLocationRef;

    dispatch(routeChanged(location, prevLocation.current));
    prevLocation.current = location;
  }, [location.pathname, location.hash]);

  useEffect(
    function listenForBrowserHistoryPop() {
      let lastPathname = history.location.pathname;

      // A Back/Forward that keeps the pathname (only search/hash changed) does
      // not fetch a page, so nothing else refreshes `appsmith.URL`. A pathname
      // change is handled by the page fetch / ROUTE_CHANGED paths.
      return history.listen((location, action) => {
        const isSamePathname = location.pathname === lastPathname;

        lastPathname = location.pathname;

        if (action === "POP" && isSamePathname) {
          dispatch(browserHistoryPopped());
        }
      });
    },
    [dispatch],
  );

  return null;
}
