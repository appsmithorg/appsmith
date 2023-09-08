import { Callout, Text } from "design-system";
import styled from "styled-components";

export const WellContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  background-color: var(--ads-color-background-secondary);
  margin-bottom: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 540px);
`;

export const WellTitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  justify-content: space-between;
`;

export const WellTitle = styled(Text)`
  font-weight: 600;
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
  height: 300px;
  object-fit: cover;
  object-position: 50% 0;
  background-color: var(--ads-color-black-200);
`;

export const ErrorCallout = styled(Callout)`
  margin-bottom: 16px;
`;
