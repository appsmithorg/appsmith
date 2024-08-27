import type { NavigationSetting } from "constants/AppConstants";
import { getTypographyByKey } from "@appsmith/ads-old";
import styled from "styled-components";

export const StyledMenuItemText = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${getTypographyByKey("h5")}
  transition: all 0.3s ease-in-out;
  font-weight: 400;

  & span {
    height: 100%;
    max-width: 162px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
