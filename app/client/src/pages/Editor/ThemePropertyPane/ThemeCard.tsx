import React, { useCallback } from "react";
import { tw } from "twind";
import * as Sentry from "@sentry/react";
import Button from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  getAppThemingMode,
  AppThemingMode,
} from "selectors/appThemingSelectors";
import { setAppThemingMode } from "actions/appThemingActions";
import { AppTheme } from "entities/AppTheming";
import { getCustomTextColor2 } from "widgets/WidgetUtils";

interface ThemeCard {
  theme: AppTheme;
  isSelected?: boolean;
  className?: string;
}

export function ThemeCard(props: ThemeCard) {
  const { theme } = props;
  const dispatch = useDispatch();
  const themingMode = useSelector(getAppThemingMode);
  const isThemeEditMode = themingMode === AppThemingMode.APP_THEME_EDIT;

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickChangeThemeButton = useCallback(() => {
    dispatch(setAppThemingMode(AppThemingMode.APP_THEME_SELECTION));
  }, [setAppThemingMode]);

  // colors
  const defaultColors = theme.config.colors;
  const userDefinedColors = theme.properties.colors;
  const primaryColor =
    userDefinedColors[Object.keys(userDefinedColors)[0]] ||
    defaultColors[Object.keys(defaultColors)[0]];
  const secondaryColor =
    userDefinedColors[Object.keys(userDefinedColors)[1]] ||
    defaultColors[Object.keys(defaultColors)[1]];

  // border radius
  const borderRadius = theme.config.borderRadius;
  const primaryBorderRadius =
    borderRadius[Object.keys(borderRadius)[0]] || "0px";

  return (
    <div
      className={`ring-1 ${
        props.isSelected && false ? "ring-primary-500 ring-1" : "ring-gray-200"
      } ${
        props.className
      } relative group overflow-hidden hover:shadow-xl transition-all cursor-pointer`}
    >
      <main className={isThemeEditMode ? "group-hover:blur-md filter" : ""}>
        <hgroup
          className={`${tw`bg-[${primaryColor}] text-[${getCustomTextColor2(
            primaryColor,
          )}]`} text-white flex p-3`}
        >
          <h3 className="flex-grow">Rounded</h3>
          <aside>@appsmith</aside>
        </hgroup>
        <section className="flex justify-between px-3 pt-3">
          <div>AaBbCc</div>
          <div className="flex items-center space-x-2">
            {Object.keys(defaultColors).map((colorKey, index) => (
              <div
                className={`${tw`bg-[${userDefinedColors[colorKey] ||
                  defaultColors[colorKey]}]`}  rounded-full h-6 w-6`}
                key={index}
              />
            ))}
          </div>
        </section>
        <section className="p-3">
          <div className="flex space-x-2">
            <div
              className={`${tw`rounded-[${primaryBorderRadius}] bg-[${primaryColor}] text-[${getCustomTextColor2(
                primaryColor,
              )}] shadow-${"md"}`} px-3 py-1`}
            >
              Button
            </div>
            <div
              className={`${tw`rounded-[${primaryBorderRadius}] bg-[${secondaryColor}] text-[${getCustomTextColor2(
                secondaryColor,
              )}] shadow-${"md"}`} px-3 py-1`}
            >
              Button
            </div>
          </div>
        </section>
      </main>
      <aside
        className={`absolute top-0 bottom-0 left-0 right-0 items-center justify-center hidden bg-black bg-opacity-25 ${
          isThemeEditMode ? "group-hover:flex" : ""
        }`}
      >
        <div className="space-y-2">
          <Button onClick={onClickChangeThemeButton} text="Change Theme" />
        </div>
      </aside>
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
