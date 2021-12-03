import styled from "styled-components";
import { Colors } from "constants/Colors";

const InfoWrapper = styled.div<{ isError?: boolean }>`
  width: 100%;
  padding: ${(props) => props.theme.spaces[3]}px;
  background: ${(props) =>
    props.isError ? Colors.FAIR_PINK : Colors.WARNING_OUTLINE_HOVER};
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
`;

export default InfoWrapper;
