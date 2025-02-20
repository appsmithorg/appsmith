import { useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { getIsAltFocusWidget, getWidgetSelectionBlock } from "selectors/ui";
import { useEffect } from "react";
import { altFocusWidget, setWidgetSelectionBlock } from "actions/widgetActions";

export function useWidgetSelectionBlockListener() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const currentFocus = identifyEntityFromPath(pathname);
  const isAltFocused = useSelector(getIsAltFocusWidget);
  const widgetSelectionIsBlocked = useSelector(getWidgetSelectionBlock);

  useEffect(() => {
    const inUIMode = [
      FocusEntity.CANVAS,
      FocusEntity.WIDGET,
      FocusEntity.WIDGET_LIST,
    ].includes(currentFocus.entity);

    dispatch(setWidgetSelectionBlock(!inUIMode));
  }, [currentFocus, dispatch]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isAltFocused, widgetSelectionIsBlocked]);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isAltFocused && widgetSelectionIsBlocked && e.metaKey) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!e.metaKey && widgetSelectionIsBlocked) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };
}
