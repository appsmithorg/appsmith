import styled from "styled-components";
import { Colors } from "constants/Colors";

export const EntityTogglesWrapper = styled.div`
  &&& {
    width: 100%;
    height: 100%;
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${Colors.GRAY2};
    cursor: pointer;
    svg,
    svg path {
      fill: ${Colors.GRAY2};
      cursor: pointer;
    }

    &:hover {
      background: var(--ads-v2-color-bg-subtle);
      svg,
      svg path {
        fill: ${Colors.WHITE};
      }
      color: ${Colors.WHITE};
    }
  }
`;
