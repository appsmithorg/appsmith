import { last } from "lodash";
import classNames from "classnames";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateSelectedAppThemeAction } from "actions/appThemingActions";
import {
  AppThemingMode,
  getAppThemingStack,
} from "selectors/appThemingSelectors";
import { AppTheme } from "entities/AppTheming";
import { getComplementaryGrayscaleColor } from "widgets/WidgetUtils";
import { getCurrentApplicationId } from "selectors/editorSelectors";

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
  const { selectable, theme } = props;
  const dispatch = useDispatch();
  const themingStack = useSelector(getAppThemingStack);
  const themingMode = last(themingStack);
  const applicationId = useSelector(getCurrentApplicationId);
  const isThemeSelectionMode =
    themingMode === AppThemingMode.APP_THEME_SELECTION;

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
    if (isThemeSelectionMode && selectable) {
      dispatch(
        updateSelectedAppThemeAction({
          applicationId,
          theme,
          isNewThemeApplied: true,
        }),
      );
    }
  }, [updateSelectedAppThemeAction, theme]);

  return (
    <div className="space-y-1">
      {selectable && (
        <h3 className="text-base text-gray-600">{props.theme.name}</h3>
      )}
      <div
        className={classNames({
          "border relative group transition-all t--theme-card": true,
          "overflow-hidden": !selectable,
          "hover:shadow-xl cursor-pointer": selectable,
        })}
        onClick={changeSelectedTheme}
      >
        <MainContainer backgroundColor={backgroundColor}>
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
          className={`absolute bottom-0 left-0 right-0 items-center justify-center hidden  bg-gray-900 bg-opacity-80 ${
            selectable ? "group-hover:flex" : ""
          }`}
        >
          <div className="py-1 text-xs tracking-wide text-white uppercase">
            Apply Theme
          </div>
        </aside>
      </div>
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
