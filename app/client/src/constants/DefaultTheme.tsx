import * as styledComponents from "styled-components"
import { Color, FontFamily, Colors, Fonts } from "./StyleConstants"

const {
  default: styled,
  css,
  keyframes,
  createGlobalStyle,
  ThemeProvider
} = styledComponents as styledComponents.ThemedStyledComponentsModule<
  IThemeInterface
>

export interface IFontInterface {
    fontSize: number
    fontColor: Color,
    fontFamily: FontFamily
}

export interface IThemeInterface {
  primaryColor: Color
  secondaryColor: Color
  ascentColor: Color
  headerFont: IFontInterface,
  titleFont: IFontInterface,
  subTitleFont: IFontInterface
}

const defaultFont: IFontInterface = {
  fontSize: 14,
  fontColor: Colors.FullBlack,
  fontFamily: Fonts.RobotoBold
}

export const theme = {
  primaryColor: Colors.FullWhite,
  secondaryColor: Colors.FullWhite,
  ascentColor: Colors.FullBlack,
  headerFont: defaultFont,
  titleFont: defaultFont,
  subTitleFont: defaultFont
}

export default styled
export { css, createGlobalStyle, keyframes, ThemeProvider }
