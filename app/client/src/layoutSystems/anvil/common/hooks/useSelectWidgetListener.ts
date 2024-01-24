import { selectAnvilWidget } from "layoutSystems/anvil/integrations/actions";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import debounce from "lodash/debounce";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * This hook is used to select a widget in the Anvil Layout System
 * A custom event is dispatched by all widgets on click
 * This hook listens to that event and dispatches the select action
 *
 * We throttle (and use trailing) the listener to prevent multiple dispatches, as well as to pick the latest event
 * The latest event is going to be the most deeply nested child that has triggered this event
 *
 * The maxWait value and wait values for throttle are variable, they can be adjusted according to the need
 * For now, 100ms seems like a good middle ground.
 */
export function useSelectWidgetListener() {
  const dispatch = useDispatch();

  // Pick the latest event and dispatch the select action
  const throttledSelectAnvilWidget = debounce(
    function (e: any) {
      dispatch(selectAnvilWidget(e.detail.widgetId, e));
    },
    100,
    { maxWait: 100, trailing: true },
  );

  const handleClick = useCallback(throttledSelectAnvilWidget, [
    selectAnvilWidget,
  ]);

  // Register and unregister the listeners on the document.body
  useEffect(() => {
    document.body.addEventListener(
      SELECT_ANVIL_WIDGET_CUSTOM_EVENT,
      handleClick,
      true,
    );
    return () => {
      document.body.removeEventListener(
        SELECT_ANVIL_WIDGET_CUSTOM_EVENT,
        handleClick,
      );
    };
  }, [handleClick]);
}
