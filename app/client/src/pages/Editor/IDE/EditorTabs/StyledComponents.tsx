import styled from "styled-components";

export const ListIconContainer = styled.div`
  height: 18px;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  img {
    width: 18px;
  }
`;

export const ListTitle = styled.span`
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;
