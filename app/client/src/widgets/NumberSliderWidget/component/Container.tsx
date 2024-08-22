import { LABEL_MARGIN_OLD_SELECT, LabelPosition } from "components/constants";
import styled from "styled-components";
import {
  LABEL_CONTAINER_CLASS,
  labelLayoutStyles,
} from "widgets/components/LabelWithTooltip";

export const SliderContainer = styled.div<{
  compactMode: boolean;
  labelPosition?: LabelPosition;
}>`
  ${labelLayoutStyles}

  padding-right: 0.4rem;
  padding-left: ${({ labelPosition }) =>
    labelPosition === LabelPosition.Top ? "0.4rem" : undefined};
  height: 100%;
  width: 100%;

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
