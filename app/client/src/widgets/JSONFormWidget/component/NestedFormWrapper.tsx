import styled from "styled-components";

import { Colors } from "constants/Colors";

type StyledWrapperProps = {
  backgroundColor?: string;
  withoutPadding?: boolean;
};

const NESTED_FORM_WRAPPER_PADDING = 10;

const NestedFormWrapper = styled.div<StyledWrapperProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || Colors.GREY_1};
  padding: ${({ withoutPadding }) =>
    withoutPadding ? 0 : NESTED_FORM_WRAPPER_PADDING}px;
`;

export default NestedFormWrapper;
