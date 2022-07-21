import styled from "styled-components";
import MenuItem from "components/ads/MenuItem";
import { Colors } from "constants/Colors";

const DangerMenuItem = styled(MenuItem)`
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

export default DangerMenuItem;
