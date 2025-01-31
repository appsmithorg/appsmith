import styled from "styled-components";
import { Text as ADSText } from "../../Text";

export const Root = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-width: 0;

  &[data-size="small"] {
    gap: var(--ads-v2-spaces-2);
  }

  &[data-size="medium"] {
    gap: var(--ads-v2-spaces-3);
  }
`;

export const Text = styled(ADSText)`
  min-width: 3ch;
  line-height: normal;

  &[data-isfixedwidth="true"] {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;

    &[data-isediting="true"] {
      text-overflow: unset;
      overflow: visible;
    }
  }
`;
