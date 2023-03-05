import { Text, TextType } from "design-system-old";
import React from "react";
import { Colors } from "constants/Colors";
import styled from "styled-components";

type Props = {
  helperText?: string;
};
const StyledHelperText = styled(Text)`
  font-weight: 400;
  font-size: 12px;
  color: ${Colors.GRAY};
  line-height: 14px;
`;

const PropertyPaneHelperText = (props: Props) => {
  if (!props.helperText) {
    return null;
  }

  return (
    <StyledHelperText
      className="t--property-control-helperText"
      type={TextType.P1}
    >
      {props.helperText}
    </StyledHelperText>
  );
};

export default PropertyPaneHelperText;
