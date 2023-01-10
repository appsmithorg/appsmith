import { Colors } from "constants/Colors";
import { css } from "styled-components";

export const BottomBarCTAStyles = css`
  height: ${(props) => props.theme.bottomBarHeight};
  width: 32px;
  :hover {
    background-color: ${Colors.GRAY_100};
  }
`;
