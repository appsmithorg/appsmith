import type { PropsWithChildren } from "react";

import { Classes, FormGroup } from "@blueprintjs/core";
import styled from "styled-components";

import { getTypographyByKey } from "../constants/typography";

type FormGroupProps = PropsWithChildren<{
  fill?: boolean;
}>;

const StyledFormGroup = styled(FormGroup)<FormGroupProps>`
  & {
    width: ${(props) => (props.fill ? "100%" : "auto")};
    &.${Classes.FORM_GROUP} {
      margin: 0 0 var(--ads-spaces-11);
    }
    &.${Classes.FORM_GROUP} .${Classes.FORM_HELPER_TEXT} {
      font-size: var(--ads-font-size-3);
    }
    &.${Classes.FORM_GROUP} .${Classes.LABEL} {
      ${getTypographyByKey("h5")}
      color: var(--ads-v2-color-fg);
    }
  }
`;

export default StyledFormGroup;
