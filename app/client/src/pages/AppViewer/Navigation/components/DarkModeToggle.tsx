import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "@appsmith/ads";
import HeaderRightItemContainer from "./HeaderRightItemContainer";
import { getDarkModeSetting } from "selectors/darkModeSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { setResolvedColorModeAction } from "ee/actions/applicationActions";
import { useResolvedColorMode } from "utils/hooks/useResolvedColorMode";
import { setDarkModePreference } from "utils/storage";

/**
 * Sun/moon toggle shown in the published app header when the developer has
 * enabled `allowEndUserSwitch`. Flips the live color mode and persists the
 * end user's choice for this app in the browser.
 */
function DarkModeToggle() {
  const dispatch = useDispatch();
  const { allowEndUserSwitch } = useSelector(getDarkModeSetting);
  const appId = useSelector(getCurrentApplicationId);
  const colorMode = useResolvedColorMode();

  const onToggle = useCallback(() => {
    if (!appId) return;

    const nextMode = colorMode === "DARK" ? "LIGHT" : "DARK";

    dispatch(setResolvedColorModeAction(appId, nextMode));
    setDarkModePreference(appId, nextMode);
  }, [appId, colorMode, dispatch]);

  if (!allowEndUserSwitch) return null;

  const isDark = colorMode === "DARK";

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <HeaderRightItemContainer>
      <Tooltip content={label}>
        <Button
          aria-label={label}
          data-testid="t--dark-mode-toggle"
          isIconButton
          kind="tertiary"
          onClick={onToggle}
          size="md"
          startIcon={isDark ? "sun-line" : "moon-line"}
        />
      </Tooltip>
    </HeaderRightItemContainer>
  );
}

export default DarkModeToggle;
