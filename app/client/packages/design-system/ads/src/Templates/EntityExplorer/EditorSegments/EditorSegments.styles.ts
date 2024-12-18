import styled from "styled-components";
import { Flex } from "../../../Flex";

export const Container = styled(Flex)`
  .editor-pane-segment-control {
    max-width: 247px;

    .ads-v2-segmented-control__segments-container-segment {
      &[data-selected="true"] {
        span {
          font-weight: var(--ads-v2-font-weight-bold);
        }
      }
    }
  }
`;
