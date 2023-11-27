import styled from "styled-components";

export const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;

export const CheckboxWrapper = styled.div<{ index?: number }>`
  padding: 16px;
  background-color: var(--ads-v2-color-gray-100);
  border-radius: 4px;
`;

export const CheckBoxGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

export const ScrollableSection = styled.section`
  overflow-y: auto;
`;

export const Bar = styled.hr`
  margin: 16px 0;
`;
