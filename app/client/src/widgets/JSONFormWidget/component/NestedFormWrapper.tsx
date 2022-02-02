import styled from "styled-components";

import { Colors } from "constants/Colors";

type StyledWrapperProps = {
  backgroundColor?: string;
};

const NESTED_FORM_WRAPPER_PADDING = 10;

const NestedFormWrapper = styled.div<StyledWrapperProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || Colors.GREY_1};
  padding: ${NESTED_FORM_WRAPPER_PADDING}px;
`;

export default NestedFormWrapper;
