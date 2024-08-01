import { selectAnvilWidget } from "layoutSystems/anvil/integrations/actions";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * This hook is used to select a widget in the Anvil Layout System
 * A custom event is dispatched by all widgets on click
 * This hook listens to that event and dispatches the select action
 *
 */
export function useSelectWidgetListener() {
  const dispatch = useDispatch();

  const handleClick = useCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function (e: any) {
      dispatch(selectAnvilWidget(e.detail.widgetId, e));
    },
    [selectAnvilWidget],
  );

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
