import styled from "styled-components";

import { LabelPosition, LABEL_MARGIN_OLD_SELECT } from "components/constants";
import { labelLayoutStyles, LABEL_CONTAINER_CLASS } from "design-system";

export const SliderContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  ${labelLayoutStyles}

  padding-right: 0.4rem;
  padding-left: ${({ labelPosition }) =>
    labelPosition === LabelPosition.Top ? "0.4rem" : undefined};

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
