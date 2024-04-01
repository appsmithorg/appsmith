import { selectAnvilWidget } from "layoutSystems/anvil/integrations/actions";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import debounce from "lodash/debounce";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

let selectQueue: Array<{ event: CustomEvent }> = [];
const debouncedSelectDispatch = debounce((dispatch) => {
  const event = selectQueue[0].event;
  dispatch(selectAnvilWidget(event.detail.widgetId, event));
  selectQueue = [];
}, 50);
/**
 * This hook is used to select a widget in the Anvil Layout System
 * A custom event is dispatched by all widgets on click
 * This hook listens to that event and dispatches the select action
 *
 */
export function useSelectWidgetListener() {
  const dispatch = useDispatch();

  const handleClick = useCallback(
    function (e: any) {
      selectQueue.push({ event: e });
      debouncedSelectDispatch(dispatch);
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
