import styled from "styled-components";
import { FormGroup, Classes } from "@blueprintjs/core";
import { getTypographyByKey } from "constants/DefaultTheme";
type FormGroupProps = {
  fill?: boolean;
};
const StyledFormGroup = styled(FormGroup)<FormGroupProps>`
  & {
    width: ${(props) => (props.fill ? "100%" : "auto")};
    &.${Classes.FORM_GROUP} {
      margin: 0 0 ${(props) => props.theme.spaces[11]}px;
    }
    &.${Classes.FORM_GROUP} .${Classes.FORM_HELPER_TEXT} {
      font-size: ${(props) => props.theme.fontSizes[3]}px;
    }
    &.${Classes.FORM_GROUP} .${Classes.LABEL} {
      ${(props) => getTypographyByKey(props, "h5")}
      color: ${(props) => props.theme.colors.textInput.normal.text};
    }
  }
`;
export default StyledFormGroup;
