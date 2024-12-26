import { Callout, Text } from "@appsmith/ads";
import styled from "styled-components";

export const WellContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  background-color: var(--ads-v2-color-gray-100);
  margin-bottom: 16px;
  flex: 1;
  flex-shrink: 1;
  overflow-y: auto;
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

export const FieldQuestion = styled(Text)<{ isDisabled?: boolean }>`
  opacity: ${({ isDisabled = false }) => (isDisabled ? "0.5" : "1")};
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
