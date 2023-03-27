import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";
import { Colors } from "constants/Colors";

export const Wrapper = styled.div`
  ${getTypographyByKey("h6")}
  font-weight: 400;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_500};
  flex-shrink: 0;
`;

// This component is used to render the additional info in the error logs.
// ex: Linenumber and error code
export default function LogAdditionalInfo(props: {
  text: string;
  datacy?: string;
}) {
  return <Wrapper data-cy={props.datacy}>{`[${props.text}]`}</Wrapper>;
}
