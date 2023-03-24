import { routeChanged } from "actions/focusHistoryActions";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppsmithLocationState } from "utils/history";
import history from "utils/history";
import type { LocationListener } from "history";

export default function RouteChangeListener() {
  const dispatch = useDispatch();
  const handler: LocationListener<AppsmithLocationState> = (
    location,
    action,
  ) => {
    dispatch(routeChanged(location, action));
  };
  useEffect(() => {
    return history.listen(handler);
  }, []);
  return null;
}
