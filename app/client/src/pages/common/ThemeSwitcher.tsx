import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setThemeMode } from "actions/themeActions";
import { ThemeMode } from "reducers/uiReducers/themeReducer";
import Switch from "components/ads/RectangularSwitcher";
import MenuItem from "components/ads/MenuItem";
import { getThemeDetails } from "selectors/themeSelectors";

export default function ThemeSwitcher(props: { className?: string }) {
  const dispatch = useDispatch();
  const themeDetails = useSelector(getThemeDetails);
  const [switchedOn, setSwitchOn] = useState(
    themeDetails.mode === ThemeMode.DARK,
  );

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
        ></Switch>
      }
    />
  );
}
