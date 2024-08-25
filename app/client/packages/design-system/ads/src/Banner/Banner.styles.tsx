import styled from "styled-components";

import { Callout } from "../Callout";
import {
  CalloutChildrenChildClassName,
  CalloutChildrenClassName,
  CalloutChildrenLinkClassName,
  CalloutCloseClassName,
} from "../Callout/Callout.constants";

export const StyledBanner = styled(Callout)`
  position: relative;
  width: 100%;
  align-items: flex-start;
  justify-content: center;
  border-radius: 0;
  border-bottom: 1px solid var(--ads-v2-colors-response-surface-default-border);

  .${CalloutChildrenClassName} {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: var(--ads-v2-spaces-3);
    text-align: center;
    margin: 0;
    /* icon width - container right padding */
    max-width: calc(
      100% - var(--ads-v2-spaces-7) - var(--ads-v2-spaces-4) - var(
          --ads-v2-spaces-11
        )
    );

    & > div {
      margin: 0;
    }

    &
      > .${CalloutChildrenChildClassName},
      &
      > .${CalloutChildrenLinkClassName} {
      padding-top: var(--ads-v2-spaces-2);
      line-height: 16px;
    }
  }

  .${CalloutCloseClassName} {
    position: absolute;
    right: 12px;
    margin: 0;
    min-width: unset;
  }
`;
