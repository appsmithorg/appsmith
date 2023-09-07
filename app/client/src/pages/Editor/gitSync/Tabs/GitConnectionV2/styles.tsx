import { Callout, Text } from "design-system";
import styled from "styled-components";

export const WellContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  background-color: #f1f5f9;
  margin-bottom: 16px;
  overflow-y: auto;
`;

export const WellTitle = styled.h3`
  margin-bottom: 16px;
`;

export const WellText = styled(Text)`
  margin-bottom: 16px;
`;

export const FieldContainer = styled.div`
  margin-bottom: 16px;
`;

export const FieldControl = styled.div`
  padding-left: 24px;
`;

export const FieldQuestion = styled(Text)`
  margin-bottom: 16px;
`;

export const DemoImage = styled.img`
  width: 100%;
  max-height: 300px;
  height: auto;
  object-fit: cover;
  object-position: 50% 0;
  background-color: var(--ads-color-black-200);
`;

export const ErrorCallout = styled(Callout)`
  margin-bottom: 16px;
`;
