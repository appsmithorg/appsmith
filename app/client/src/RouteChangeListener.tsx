import { routeChanged } from "actions/focusHistoryActions";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import history from "utils/history";
import type { AppsmithLocationState } from "utils/history";
import type { LocationListener } from "history";

export default function RouteChangeListener() {
  useHistoryListen();
  return null;
}

const useHistoryListen = () => {
  const dispatch = useDispatch();
  const handler = useCallback<LocationListener<AppsmithLocationState>>(
    (location, action) => {
      dispatch(routeChanged(location, action));
    },
    [],
  );

  // Create a ref that stores handler
  const savedHandler = useRef<LocationListener<AppsmithLocationState>>();
  // Update ref.current value if handler changes.
  //
  // This allows our effect below to always get the latest handler without us
  // needing to pass it in effect deps array and potentially cause effect
  //  to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (savedHandler.current) {
      history.listen(savedHandler.current);
    }
  }, []);
};
