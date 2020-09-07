import { Theme } from "constants/DefaultTheme";
import styled from "styled-components";

export interface CommonComponentProps {
  isLoading?: boolean; //default false
  cypressSelector?: string;
  disabled?: boolean; //default false
}

export type ThemeProp = {
  theme: Theme;
};

export enum Classes {
  ICON = "cs-icon",
  TEXT = "cs-text",
}

export const hexToRgb = (
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
};

export const hexToRgba = (color: string, alpha: number) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha});`;
};

export const StoryWrapper = styled.div`
  background: #1a191c;
  height: 700px;
  padding: 50px 100px;
`;
