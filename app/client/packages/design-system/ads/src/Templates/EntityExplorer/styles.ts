import styled from "styled-components";

export const ListItemContainer = styled.div`
  width: 100%;

  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

export const ListHeaderContainer = styled.div`
  padding: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;

  span {
    line-height: 20px;
  }
`;
