import styled from "styled-components";
import * as Sentry from "@sentry/react";
import React from "react";

import type { AppTheme } from "entities/AppTheming";
import { getComplementaryGrayscaleColor } from "widgets/WidgetUtils";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 * ----------------------------------------------------------------------------
 */
type ThemeCard = React.PropsWithChildren<{
  theme: AppTheme;
}>;

const MainContainer = styled.main<{ backgroundColor: string }>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: var(--ads-v2-border-radius);
`;

const HeaderContainer = styled.main<{ primaryColor: string }>`
  background-color: ${({ primaryColor }) => primaryColor};
  color: ${({ primaryColor }) => getComplementaryGrayscaleColor(primaryColor)};
  border-radius: var(--ads-v2-border-radius) var(--ads-v2-border-radius) 0 0;
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

const ThemeCardBody = styled.div`
  border-radius: 0 0 var(--ads-v2-border-radius) var(--ads-v2-border-radius);
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 * ----------------------------------------------------------------------------
 */
export function ThemeCard(props: ThemeCard) {
  const { theme } = props;

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

  return (
    <div className="space-y-1 group">
      <div className="border relative group transition-all t--theme-card rounded overflow-hidden">
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
          <ThemeCardBody className="p-3">
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
          </ThemeCardBody>
        </MainContainer>
      </div>
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
