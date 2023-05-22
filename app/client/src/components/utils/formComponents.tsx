import { Colors } from "constants/Colors";
import { Menu, MenuItem } from "design-system-old";
import styled from "styled-components";

export const MenuComponent = styled(Menu)`
  flex: 0;
  margin: auto;
`;

export const MenuWrapper = styled.div`
  display: flex;
  margin: 8px 0px;
`;

export const RedMenuItem = styled(MenuItem)`
  &&,
  && .cs-text {
    color: ${Colors.DANGER_SOLID};
  }

  &&,
  &&:hover {
    svg,
    svg path {
      fill: ${Colors.DANGER_SOLID};
    }
  }
`;
