import { routeChanged } from "actions/focusHistoryActions";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import history from "utils/history";
import type { AppsmithLocationState } from "utils/history";
import type { LocationListener } from "history";

export default function RouteChangeListener() {
  const dispatch = useDispatch();
  useEffect(() => {
    const handler: LocationListener<AppsmithLocationState> = (
      location,
      action,
    ) => {
      dispatch(routeChanged(location, action));
    };
    const historyUnregister = history.listen(handler);
    return () => historyUnregister();
  }, []);
  return null;
}
