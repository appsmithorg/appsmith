import styled from "styled-components";
import { Text } from "design-system";

export const Wrapper = styled.div`
  padding: 48px;
  background-color: var(--ads-v2-color-bg);
  margin-right: 24px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
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
