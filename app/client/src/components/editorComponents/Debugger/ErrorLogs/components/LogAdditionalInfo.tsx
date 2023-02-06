import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";
import { Colors } from "constants/Colors";

export const Wrapper = styled.div<{ width: string }>`
  ${getTypographyByKey("h6")}
  font-weight: 400;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_500};
  min-width: ${(props) => props.width};
`;

export default function LogAdditionalInfo(props: {
  text: string;
  width: string;
}) {
  return <Wrapper width={props.width}>{`[${props.text}]`}</Wrapper>;
}
