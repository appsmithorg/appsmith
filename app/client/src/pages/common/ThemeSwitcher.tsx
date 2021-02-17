import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setThemeMode } from "actions/themeActions";
import Switch from "components/alloy/RectangularSwitcher";
import MenuItem from "components/alloy/MenuItem";
import { getCurrentThemeMode, ThemeMode } from "selectors/themeSelectors";

export default function ThemeSwitcher(props: { className?: string }) {
  const dispatch = useDispatch();
  const themeMode = useSelector(getCurrentThemeMode);
  const [switchedOn, setSwitchOn] = useState(themeMode === ThemeMode.DARK);

  return (
    <MenuItem
      text="Theme"
      label={
        <Switch
          className={props.className}
          value={switchedOn}
          onSwitch={(value) => {
            setSwitchOn(value);
            dispatch(setThemeMode(value ? ThemeMode.DARK : ThemeMode.LIGHT));
          }}
        />
      }
    />
  );
}
