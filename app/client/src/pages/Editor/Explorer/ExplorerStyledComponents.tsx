import styled from "styled-components";
import { Colors } from "constants/Colors";

export const EntityTogglesWrapper = styled.div`
  &&& {
    flex: 0 0 ${props => props.theme.fontSizes[5]}px;
    width: ${props => props.theme.fontSizes[5]}px;
    height: ${props => props.theme.fontSizes[5]}px;
    font-size: ${props => props.theme.fontSizes[5]}px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${Colors.SLATE_GRAY};
    svg,
    svg path {
      fill: ${Colors.SLATE_GRAY};
    }
    &:hover {
      background: ${Colors.SHARK};
      svg,
      svg path {
        fill: ${Colors.WHITE};
      }
      color: ${Colors.WHITE};
    }
  }
`;
