import styled from "styled-components";

import { Button } from "../../../Button";

export const Root = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-3);
  width: 100%;
`;

export const SquareButton = styled(Button)`
  && {
    max-width: 24px;
    min-width: 24px;
  }
`;
