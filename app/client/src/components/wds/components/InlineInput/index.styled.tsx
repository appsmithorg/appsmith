import styled, { css } from "styled-components";

import { InlineInputProps } from ".";

export const Container = styled.div`
  display: flex;
  gap: 8px;
`;

export const LabelWrapper = styled.div<Pick<InlineInputProps, "labelPosition">>`
  display: inline-flex;
  flex-direction: column;
  cursor: pointer;
  order: ${({ labelPosition }) => (labelPosition === "left" ? 1 : 2)};
  line-height: 20px;
  font-size: 14px;
  gap: 5px;
`;

export const Label = styled.label`
  cursor: default;
`;
