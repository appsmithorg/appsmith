import { tw, css } from "twind/css";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAppThemingStack,
  AppThemingMode,
} from "selectors/appThemingSelectors";
import {
  changeSelectedThemeAction,
  setAppThemingModeStack,
} from "actions/appThemingActions";
import { last } from "lodash";
import Button, { Category } from "components/ads/Button";
import { AppTheme } from "entities/AppTheming";
import { getCustomTextColor2 } from "widgets/WidgetUtils";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";

interface ThemeCard {
  theme: AppTheme;
  isSelected?: boolean;
  className?: string;
  selectable?: boolean;
  editable?: boolean;
  changeable?: boolean;
}

const BlackButton = styled(Button)`
  border: 2px solid ${Colors.BLACK};
  background-color: ${Colors.BLACK};
  color: ${Colors.WHITE};

  &:hover {
    border: 2px solid ${Colors.BLACK};
    background-color: ${Colors.MINE_SHAFT};
    color: ${Colors.WHITE};
  }
`;

export function ThemeCard(props: ThemeCard) {
  const { changeable, editable, selectable, theme } = props;
  const dispatch = useDispatch();
  const themingStack = useSelector(getAppThemingStack);
  const applicationId = useSelector(getCurrentApplicationId);
  const themingMode = last(themingStack);
  const isThemeSelectionMode =
    themingMode === AppThemingMode.APP_THEME_SELECTION;

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickChangeThemeButton = useCallback(() => {
    dispatch(
      setAppThemingModeStack([
        ...themingStack,
        AppThemingMode.APP_THEME_SELECTION,
      ]),
    );
  }, [setAppThemingModeStack]);

  /**
   * sets the mode to THEME_SELECTION
   */
  const onClickEditThemeButton = useCallback(() => {
    dispatch(
      setAppThemingModeStack([...themingStack, AppThemingMode.APP_THEME_EDIT]),
    );
  }, [changeSelectedThemeAction]);

  // colors
  const userDefinedColors = theme.properties.colors;
  const primaryColor = userDefinedColors.primaryColor;
  const backgroundColor = userDefinedColors.backgroundColor;

  // border radius
  const borderRadius = theme.properties.borderRadius;
  const primaryBorderRadius = borderRadius[Object.keys(borderRadius)[0]];

  // box shadow
  const boxShadow = theme.properties.boxShadow;
  const primaryBoxShadow = boxShadow[Object.keys(boxShadow)[0]];

  /**
   * fires action for changing theme
   *
   * NOTE: since we are same card in theme edit and theme selection,
   * we don't need to fire the action in theme edit mode on click on the card
   */
  const changeSelectedTheme = useCallback(() => {
    if (isThemeSelectionMode) {
      dispatch(changeSelectedThemeAction({ applicationId, theme }));
    }
  }, [changeSelectedThemeAction]);

  return (
    <div
      className={`p-0.5 ${
        props.className
      } ring-gray-200 ring-1 overflow-hidden relative group  transition-all cursor-pointer ${
        changeable || editable ? "hover:shadow-xl" : ""
      }`}
      onClick={changeSelectedTheme}
    >
      <main
        className={`${tw`bg-[${backgroundColor}]`} ${
          changeable || editable ? "group-hover:blur-md filter" : ""
        }`}
      >
        <hgroup
          className={`${tw`bg-[${primaryColor}] text-[${getCustomTextColor2(
            primaryColor,
          )}]`} text-white flex p-3`}
        >
          <h3 className="flex-grow">{theme.name}</h3>
          <aside>@appsmith</aside>
        </hgroup>
        <section className="flex justify-between px-3 pt-3">
          <div
            className={`${tw`text-[${getCustomTextColor2(backgroundColor)}]`}`}
          >
            AaBbCc
          </div>
          <div className="flex items-center space-x-2">
            {Object.keys(userDefinedColors).map((colorKey, index) => (
              <div
                className={`${tw`bg-[${userDefinedColors[colorKey] ||
                  userDefinedColors[colorKey]}]`} border rounded-full h-6 w-6`}
                key={index}
              />
            ))}
          </div>
        </section>
        <section className="p-3">
          <div className="flex space-x-2">
            <button
              className={`${tw`rounded-[${primaryBorderRadius}] bg-[${primaryColor}] text-[${getCustomTextColor2(
                primaryColor,
              )}] px-4 py-1 ${tw`${css({
                "&": {
                  boxShadow: primaryBoxShadow,
                },
              })}`}`}`}
            >
              Button
            </button>
            <button
              className={`${tw`rounded-[${primaryBorderRadius}] border border-[${primaryColor}] bg-white text-[${primaryColor}] ${tw`${css(
                {
                  "&": {
                    boxShadow: primaryBoxShadow,
                  },
                },
              )}`}`} px-4 py-1`}
            >
              Button
            </button>
          </div>
        </section>
      </main>
      <aside
        className={`absolute top-0 bottom-0 left-0 right-0 items-center justify-center hidden bg-black bg-opacity-25 ${
          changeable || editable ? "group-hover:flex" : ""
        }`}
      >
        <div className="space-y-2">
          {changeable && (
            <Button onClick={onClickChangeThemeButton} text="Change Theme" />
          )}
          {editable && (
            <BlackButton
              category={Category.tertiary}
              fill
              onClick={onClickEditThemeButton}
              text="Edit Theme"
            />
          )}
        </div>
      </aside>
      <aside
        className={`absolute bottom-0 left-0 right-0 items-center justify-center hidden  bg-gray-900 bg-opacity-80 ${
          selectable ? "group-hover:flex" : ""
        }`}
      >
        <div className="py-1 text-xs tracking-wide text-white uppercase">
          Apply this theme
        </div>
      </aside>
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
