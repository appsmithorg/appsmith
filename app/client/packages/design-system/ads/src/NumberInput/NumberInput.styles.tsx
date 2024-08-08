import styled from "styled-components";
import { Input } from "../Input";
import {
  InputEndIconClassName,
  InputSectionInputClassName,
  InputStartIconClassName,
} from "../Input/Input.constants";

export const StyledNumberInput = styled(Input)`
  & .${InputSectionInputClassName} {
    text-align: center;
  }

  & .${InputEndIconClassName}, & .${InputStartIconClassName} {
    cursor: pointer;
  }
`;
