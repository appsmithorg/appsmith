import styled from "styled-components";

export const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;

export const CheckboxWrapper = styled.div<{ index?: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: 16px;
  background-color: var(--ads-v2-color-gray-100);
  gap: 16px;
  border-radius: 4px;
  margin-left: ${(props) => (props?.index ? `"${props.index} *2"px` : "0px")};
`;

export const ScrollableSection = styled.section`
  overflow-y: auto;
`;

export const Bar = styled.hr`
  margin: 16px 0;
`;
