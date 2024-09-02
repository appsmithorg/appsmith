import styled from "styled-components";
import { Text } from "@appsmith/ads";

export const Wrapper = styled.div<{ isModalLayout?: boolean }>`
  ${(props) =>
    !props.isModalLayout &&
    `
  padding: 48px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  `}

  margin-right: 24px;
  .grid {
    display: flex;
  }

  .grid_column {
    padding: 11px;
  }
`;

export const SubheadingText = styled(Text)`
  font-weight: 600;
  margin-bottom: 4px;
`;

export const HorizontalLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: var(--ads-v2-color-bg-emphasis);
  margin: 48px 0;
`;

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 16px;
  margin-top: ${(props) => props.theme.spaces[9]}px;
`;
