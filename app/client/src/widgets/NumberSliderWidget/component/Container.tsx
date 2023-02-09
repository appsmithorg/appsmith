import styled from "styled-components";

import { LabelPosition, LABEL_MARGIN_OLD_SELECT } from "components/constants";
import {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "widgets/components/LabelWithTooltip";

export const SliderContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  ${labelLayoutStyles}

  .auto-layout && {
    height: 50px !important;
    min-width: 150px;
  }

  padding-right: 0.4rem;
  padding-left: ${({ labelPosition }) =>
    labelPosition === LabelPosition.Top ? "0.4rem" : undefined};
  height: 100%;

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
