import styled from "styled-components";
import { FormGroup } from "@blueprintjs/core";
type FormGroupProps = {
  fill?: boolean;
};
const StyledFormGroup = styled(FormGroup)<FormGroupProps>`
  & {
    width: ${props => (props.fill ? "100%" : "auto")};
  }
`;
export default StyledFormGroup;
