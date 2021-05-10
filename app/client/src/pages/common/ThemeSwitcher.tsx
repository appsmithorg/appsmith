import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setThemeMode } from "actions/themeActions";
import Switch from "components/ads/RectangularSwitcher";
import MenuItem from "components/ads/MenuItem";
import { getCurrentThemeMode, ThemeMode } from "selectors/themeSelectors";

export default function ThemeSwitcher(props: { className?: string }) {
  const dispatch = useDispatch();
  const themeMode = useSelector(getCurrentThemeMode);
  const [switchedOn, setSwitchOn] = useState(themeMode === ThemeMode.DARK);

  return (
    <MenuItem
      label={
        <Switch
          className={props.className}
          onSwitch={(value) => {
            setSwitchOn(value);
            dispatch(setThemeMode(value ? ThemeMode.DARK : ThemeMode.LIGHT));
          }}
          value={switchedOn}
        />
      }
      text="Theme"
    />
  );
}
