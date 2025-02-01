import styled from "styled-components";
import { Button } from "../..";

export const Root = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ads-v2-color-border-muted);
  background-color: var(--ads-v2-color-bg);
  gap: var(--ads-v2-spaces-2);
  max-height: 32px;
  min-height: 32px;
  padding: 0 var(--ads-v2-spaces-2);
  width: 100%;
  overflow: hidden;
`;

export const IconButton = styled(Button)`
  margin-left: auto;
  && {
    min-width: 24px;
  }
`;
