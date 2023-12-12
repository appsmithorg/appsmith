import styled from "styled-components";

export const BuildingBlockWrapper = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  margin-bottom: 24px;
  cursor: pointer;
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
  }
`;

export const ImageWrapper = styled.div`
  overflow: hidden;
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
`;

export const StyledImage = styled.img`
  object-fit: cover;
  width: 100%;
  height: 236px;
`;

export const BuildingBlockContent = styled.div`
  padding: 0 25px 16px 25px;
  display: flex;
  flex-direction: column;
  flex: 1;

  .title {
    color: var(--ads-v2-color-fg-emphasis-plus);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  .description {
    margin-top: ${(props) => props.theme.spaces[2]}px;
    color: var(--ads-v2-color-fg);
    font-size: 15px;
    height: 65px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  }
`;

export const BuildingBlockContentFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: ${(props) => props.theme.spaces[9]}px;
`;
