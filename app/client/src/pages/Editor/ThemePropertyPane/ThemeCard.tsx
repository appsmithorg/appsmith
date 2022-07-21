import { last } from "lodash";
import classNames from "classnames";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DeleteIcon from "remixicon-react/DeleteBinLineIcon";

import {
  changeSelectedAppThemeAction,
  deleteAppThemeAction,
} from "actions/appThemingActions";
import {
  AppThemingMode,
  getAppThemingStack,
} from "selectors/appThemingSelectors";
import { AppTheme } from "entities/AppTheming";
import AnalyticsUtil from "utils/AnalyticsUtil";
import DeleteThemeModal from "./DeleteThemeModal";
import { getComplementaryGrayscaleColor } from "widgets/WidgetUtils";
import { getCurrentApplicationId } from "selectors/editorSelectors";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
type ThemeCard = React.PropsWithChildren<{
  theme: AppTheme;
  isSelected?: boolean;
  className?: string;
  selectable?: boolean;
  deletable?: boolean;
}>;

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
  const { deletable, selectable, theme } = props;
  const dispatch = useDispatch();
  const themingStack = useSelector(getAppThemingStack);
  const themingMode = last(themingStack);
  const applicationId = useSelector(getCurrentApplicationId);
  const isThemeSelectionMode =
    themingMode === AppThemingMode.APP_THEME_SELECTION;
  const [isDeleteModalOpen, toggleDeleteModal] = useState(false);

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
  const changeSelectedTheme = () => {
    AnalyticsUtil.logEvent("APP_THEMING_APPLY_THEME", {
      themeId: theme.id,
      themeName: theme.name,
    });

    if (isThemeSelectionMode && selectable) {
      dispatch(
        changeSelectedAppThemeAction({
          applicationId,
          theme,
        }),
      );
    }
  };

  const openDeleteModalFn = () => toggleDeleteModal(true);
  const closeDeleteModalFn = () => toggleDeleteModal(false);

  /**
   * dispatch delete app theme action
   */
  const onDeleteTheme = () => {
    AnalyticsUtil.logEvent("APP_THEMING_DELETE_THEME", {
      themeId: theme.id,
      themeName: theme.name,
    });

    dispatch(deleteAppThemeAction({ themeId: theme.id, name: theme.name }));

    closeDeleteModalFn();
  };

  return (
    <>
      <div className="space-y-1 group">
        {selectable && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-600 break-all">
              {props.theme.displayName}
            </h3>
            {deletable && (
              <button
                className="p-1 opacity-0 group-hover:block hover:bg-gray-100 group-hover:opacity-100"
                onClick={openDeleteModalFn}
              >
                <DeleteIcon className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
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
                  className="px-3 py-0.5 text-sm"
                >
                  Button
                </ThemeColorButton>
                <ThemeColorButton
                  backgroundColor="white"
                  borderColor={primaryColor}
                  borderRadius={primaryBorderRadius}
                  boxShadow={primaryBoxShadow}
                  className="px-3 py-0.5 border text-sm"
                >
                  Button
                </ThemeColorButton>
              </div>
            </section>
          </MainContainer>
          <aside
            className={`absolute bottom-0 left-0 right-0 items-center justify-center hidden  bg-gray-900/80 ${
              selectable ? "group-hover:flex" : ""
            }`}
          >
            <div className="py-1 text-xs tracking-wide text-white uppercase">
              Apply Theme
            </div>
          </aside>
          {props.children}
        </div>
      </div>
      <DeleteThemeModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModalFn}
        onDelete={onDeleteTheme}
      />
    </>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
