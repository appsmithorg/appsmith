import { last } from "lodash";
import classNames from "classnames";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setAppThemingModeStack,
  setPreviewAppThemeAction,
  changeSelectedAppThemeAction,
} from "actions/appThemingActions";
import {
  AppThemingMode,
  getAppThemingStack,
} from "selectors/appThemingSelectors";
import { Colors } from "constants/Colors";
import { AppTheme } from "entities/AppTheming";
import Button, { Category } from "components/ads/Button";
import CheckmarkIcon from "remixicon-react/CheckLineIcon";
import { getComplementaryGrayscaleColor } from "widgets/WidgetUtils";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
interface ThemeCard {
  theme: AppTheme;
  isSelected?: boolean;
  className?: string;
  selectable?: boolean;
  editable?: boolean;
  changeable?: boolean;
}

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */
const BlackButton = styled(Button)`
  border: 2px solid ${Colors.BLACK};
  background-color: ${Colors.BLACK};
  color: ${Colors.WHITE};
  cursor: pointer;

  &:hover {
    border: 2px solid ${Colors.BLACK};
    background-color: ${Colors.MINE_SHAFT};
    color: ${Colors.WHITE};
  }
`;

const MainContainer = styled.main<{ backgroundColor: string }>`
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const HeaderContainer = styled.main<{ primaryColor: string }>`
  background-color: ${({ primaryColor }) => primaryColor};
  color: ${({ primaryColor }) => getComplementaryGrayscaleColor(primaryColor)};
`;

const MainText = styled.main<{ backgroundColor: string }>`
  color: ${({ backgroundColor }) =>
    getComplementaryGrayscaleColor(backgroundColor)};
`;

const ThemeColorCircle = styled.main<{ backgroundColor: string }>`
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const ThemeColorButton = styled.main<{
  backgroundColor: string;
  borderRadius: string;
  boxShadow: string;
  secondary?: boolean;
  borderColor: string;
}>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  box-shadow: ${({ boxShadow }) => boxShadow};
  border: ${({ borderColor }) => `1px solid ${borderColor}`};
  border-radius: ${({ borderRadius }) => borderRadius};
  color: ${({ backgroundColor }) =>
    getComplementaryGrayscaleColor(backgroundColor)};
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
export function ThemeCard(props: ThemeCard) {
  const { changeable, editable, selectable, theme } = props;
  const dispatch = useDispatch();
  const themingStack = useSelector(getAppThemingStack);
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
  }, [setAppThemingModeStack]);

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
      dispatch(setPreviewAppThemeAction(theme));
      // dispatch(changeSelectedAppThemeAction({ applicationId, theme }));
    }
  }, [changeSelectedAppThemeAction]);

  return (
    <div
      className={classNames({
        "border relative group hover:shadow-xl transition-all cursor-pointer t--theme-card": true,
        "ring-gray-700 ring-2": props.isSelected,
        "ring-gray-200": !props.isSelected,
        "overflow-hidden": !selectable,
      })}
      onClick={changeSelectedTheme}
    >
      <MainContainer
        backgroundColor={backgroundColor}
        className={`${
          changeable || editable ? "group-hover:blur-md filter" : ""
        }`}
      >
        <HeaderContainer
          className="flex h-3 text-white"
          primaryColor={primaryColor}
        />
        <section className="flex justify-between px-3 pt-3">
          <MainText backgroundColor={backgroundColor} className="text-base">
            AaBbCc
          </MainText>
          <div className="flex items-center space-x-2">
            {Object.keys(userDefinedColors).map((colorKey, index) => (
              <ThemeColorCircle
                backgroundColor={
                  userDefinedColors[colorKey] || userDefinedColors[colorKey]
                }
                className="w-6 h-6 border rounded-full"
                key={index}
              />
            ))}
          </div>
        </section>
        <section className="p-3">
          <div className="flex space-x-2">
            <ThemeColorButton
              backgroundColor={primaryColor}
              borderColor="transparent"
              borderRadius={primaryBorderRadius}
              boxShadow={primaryBoxShadow}
              className="px-4 py-1"
            >
              Button
            </ThemeColorButton>
            <ThemeColorButton
              backgroundColor="white"
              borderColor={primaryColor}
              borderRadius={primaryBorderRadius}
              boxShadow={primaryBoxShadow}
              className="px-4 py-1 border"
            >
              Button
            </ThemeColorButton>
          </div>
        </section>
      </MainContainer>
      <aside
        className={`absolute top-0 bottom-0 left-0 right-0 items-center justify-center hidden bg-black bg-opacity-25 ${
          changeable || editable ? "group-hover:flex" : ""
        }`}
      >
        <div className="space-y-2">
          {changeable && (
            <Button
              className="t--change-theme-btn"
              onClick={onClickChangeThemeButton}
              text="Change Theme"
            />
          )}
          {editable && (
            <BlackButton
              category={Category.tertiary}
              className="t--edit-theme-btn"
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
          Apply Theme
        </div>
      </aside>
      {props.isSelected && (
        <CheckmarkIcon className="absolute w-6 h-6 text-white bg-gray-700 border-2 border-white rounded-full -right-2 -top-2" />
      )}
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
