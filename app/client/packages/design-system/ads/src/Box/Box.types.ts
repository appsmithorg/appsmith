import type React from "react";
import type {
  BackgroundsProps as BackgroundProps,
  BordersProps as BorderProps,
  EffectsProps,
  ITheme,
  InteractivityProps,
  LayoutProps,
  Size,
  SizingProps,
  SystemProp,
  Theme,
  TransformsProps,
  FlexboxesProps,
  FlexboxGridsProps,
  GridsProps,
} from "@xstyled/styled-components";
import type * as CSS from "csstype";

import type { Spaces } from "../__config__/types";

interface WidthProps<T extends ITheme = Theme> {
  width?: SystemProp<Size<T> | CSS.Property.Width, T>;
}

interface HeightProps<T extends ITheme = Theme> {
  height?: SystemProp<Size<T> | CSS.Property.Height, T>;
}

interface SpaceProps {
  m?: Spaces;
  margin?: Spaces;
  mt?: Spaces;
  marginTop?: Spaces;
  mr?: Spaces;
  marginRight?: Spaces;
  mb?: Spaces;
  marginBottom?: Spaces;
  ml?: Spaces;
  marginLeft?: Spaces;
  mx?: Spaces;
  my?: Spaces;
  p?: Spaces;
  padding?: Spaces;
  pt?: Spaces;
  paddingTop?: Spaces;
  pr?: Spaces;
  paddingRight?: Spaces;
  pb?: Spaces;
  paddingBottom?: Spaces;
  pl?: Spaces;
  paddingLeft?: Spaces;
  px?: Spaces;
  py?: Spaces;
  gap?: Spaces;
}

export type BoxProps = WidthProps &
  HeightProps &
  SpaceProps &
  LayoutProps &
  SizingProps &
  BackgroundProps &
  BorderProps &
  InteractivityProps &
  EffectsProps &
  TransformsProps &
  FlexboxesProps &
  FlexboxGridsProps &
  Omit<GridsProps, "gap"> &
  React.HTMLAttributes<HTMLDivElement>;
