import { Text, TextType } from "@appsmith/ads-old";
import React from "react";
import styled from "styled-components";

interface Props {
  helperText?: string;
}
const StyledHelperText = styled(Text)`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
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
