import styled from "styled-components";
import { Text as ADSText } from "@appsmith/ads";

export const Root = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--ads-v2-spaces-1);
`;

export const Text = styled(ADSText)`
  min-width: 3ch;
  padding: 0 var(--ads-v2-spaces-1);
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
