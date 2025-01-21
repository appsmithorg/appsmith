import styled from "styled-components";
import { Text as ADSText } from "../../Text";

export const Root = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: start;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
`;

export const Text = styled(ADSText)`
  min-width: 3ch;
  bottom: -0.5px;
`;

export const IconContainer = styled.div`
  height: 12px;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 12px;
  }
`;
