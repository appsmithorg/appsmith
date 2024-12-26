import { Divider, Text } from "@appsmith/ads";
import styled from "styled-components";

export const StyledDivider = styled(Divider)`
  margin-bottom: var(--ads-spaces-7);
  border-color: var(--ads-v2-color-bg-muted);
`;

export const DatasourceSection = styled.div`
  gap: var(--ads-v2-spaces-5);
  display: flex;
  flex-direction: column;
`;

export const DatasourceSectionHeading = styled(Text)`
  font-size: var(--ads-v2-font-size-6);
`;

export const DatasourceContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(218.25px, 1fr));
  gap: var(--ads-v2-spaces-5);
  min-width: 150px;
  border-radius: 4px;
  align-items: center;
`;

export const DatasourceCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }

  .cta {
    display: none;
    margin-right: 32px;
  }

  &:hover {
    .cta {
      display: flex;
    }
  }
`;

export const DatasourceImage = styled.img`
  height: 24px;
  width: auto;
  max-width: 100%;
  flex-shrink: 0;
`;

export const DatasourceNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const DatasourceName = styled(Text)`
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-bold);
  line-height: var(--ads-v2-line-height-4);
  color: var(--ads-v2-color-fg);
`;

export const DatasourceDescription = styled.div`
  color: var(--ads-v2-color-fg-muted);
  font-size: var(--ads-v2-font-size-3);
  font-weight: var(--ads-v2-font-weight-normal);
  line-height: var(--ads-v2-line-height-2);
`;
