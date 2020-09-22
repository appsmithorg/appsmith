import Toggle from "components/ads/Toggle";
import React from "react";
import { useDispatch } from "react-redux";
import { setThemeMode } from "actions/themeActions";
import { ThemeMode } from "reducers/uiReducers/themeReducer";

export default function ThemeSwitcher(props: { className?: string }) {
  const dispatch = useDispatch();
  return (
    <Toggle
      className={props.className}
      value={true}
      onToggle={value => {
        dispatch(setThemeMode(value ? ThemeMode.LIGHT : ThemeMode.DARK));
      }}
    ></Toggle>
  );
}
