import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Classes } from "components/ads/common";

const InfoWrapper = styled.div<{ isError?: boolean }>`
  width: 100%;
  padding: ${(props) => props.theme.spaces[3]}px;
  background: ${(props) =>
    props.isError ? Colors.FAIR_PINK : Colors.WARNING_OUTLINE_HOVER};
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  display: inline-flex;
  .${Classes.TEXT} {
    display: block;
  }
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[8]}px;
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
`;

export default InfoWrapper;
