import styled from "styled-components";

import { StyledButton as Button } from "widgets/ButtonWidget/component";

const StyledButton = styled(Button)`
  padding: 6px 12px;
  min-width: 90px;
  line-height: 1.2;
  height: 2rem !important;

  span {
    max-width: 100%;
  }
`;

export default StyledButton;
