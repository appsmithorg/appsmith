import styled from "styled-components";

const BranchListItemContainer = styled.div<{
  isSelected?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}>`
  padding: ${(props) => `${props.theme.spaces[4]}px`};
  margin: ${(props) => `${props.theme.spaces[1]}px 0`};
  color: var(--ads-v2-color-fg-emphasis);
  cursor: pointer;
  width: 100%;
  height: 36px;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.isSelected || props.isActive ? "var(--ads-v2-color-bg-muted)" : ""};
  ${(props) =>
    !props.isActive &&
    `&:hover {
  background-color: var(--ads-v2-color-bg-subtle);
  }`}

  display: flex;
  align-items: center;

  .branch-list-item-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }
`;

export default BranchListItemContainer;
