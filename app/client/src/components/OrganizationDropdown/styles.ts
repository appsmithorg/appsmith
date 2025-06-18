import { Icon } from "@appsmith/ads";
import styled from "styled-components";

export const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  margin: var(--ads-v2-spaces-3) 0;
`;

export const DropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  color: var(--ads-v2-color-fg);
  transition: all 0.2s ease;
  min-height: 40px;
`;

export const TriggerContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  min-width: 0;
  flex: 1;
`;

export const TriggerText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
`;

export const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-2);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);
  z-index: var(--ads-v2-z-index-7);
  max-height: 320px;
  overflow-y: auto;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transform: ${({ isOpen }) => (isOpen ? "translateY(0)" : "translateY(-8px)")};
  transition: all 0.2s ease;
`;

export const MenuItem = styled.div<{
  isSelected?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  margin-bottom: var(--ads-v2-spaces-2);
  border-radius: var(--ads-v2-border-radius);
  cursor: ${({ isSelected }) => (isSelected ? "default" : "pointer")};
  font-size: 14px;
  color: var(--ads-v2-color-fg);
  background: ${({ isSelected }) =>
    isSelected ? "var(--ads-v2-color-bg-muted)" : "transparent"};

  .hover-icon {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    background: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};

    .hover-icon {
      opacity: ${({ isSelected }) => (isSelected ? 0 : 1)};
    }
  }

  &:focus {
    outline: none;
    background: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};

    .hover-icon {
      opacity: ${({ isSelected }) => (isSelected ? 0 : 1)};
    }
  }
`;

export const MenuItemIcon = styled(Icon)`
  color: var(--ads-v2-color-fg-muted);
  flex-shrink: 0;
`;

export const MenuItemText = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  min-width: 0;
`;

export const SectionDivider = styled.div`
  height: 1px;
  background: var(--ads-v2-color-border);
  margin: var(--ads-v2-spaces-2) 0;
`;

export const SectionHeader = styled.div`
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  font-size: 14px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
`;
