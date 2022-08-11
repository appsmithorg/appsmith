import styled from "styled-components";

import { LabelPosition, LABEL_MARGIN_OLD_SELECT } from "components/constants";
import {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "components/ads/LabelWithTooltip";

export const SliderContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
 ${labelLayoutStyles}
  & .${LABEL_CONTAINER_CLASS} {
    label {
      ${({ labelPosition }) => {
        if (!labelPosition) {
          return `margin-bottom: ${LABEL_MARGIN_OLD_SELECT}`;
        }
      }};
    }
  }
`;
