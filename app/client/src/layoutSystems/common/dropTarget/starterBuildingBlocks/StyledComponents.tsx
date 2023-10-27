import styled from "styled-components";
import { Text } from "design-system";

import { Colors } from "constants/Colors";

export const TemplateLayoutFrame = styled.div<{ screenshot?: string | null }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  align-items: center;
  background: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) =>
      props.screenshot ? `url(${props.screenshot}) no-repeat` : "none"};
    background-size: contain;
    background-position: center;
    opacity: 0.6;
    z-index: -1;
  }
`;

export const TemplateLayoutContainer = styled.div`
  flex-direction: column;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  margin-top: 160px;
  margin-bottom: 16px;
  border-radius: 4px;

  background-color: transparent;
  transition: box-shadow 0.3s ease;

  &:hover {
    background-color: ${Colors.WHITE};
    box-shadow: 0px 1px 20px 0px rgba(76, 86, 100, 0.11);
  }
`;

export const TemplateLayoutHeaderText = styled(Text)<{ layoutActive: boolean }>`
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin-bottom: 16px;
  color: var(--colors-semantics-text-emphasis);
  opacity: ${(props) => (props.layoutActive ? "1" : "0.7")};
`;

export const TemplateLayoutRowItemTitle = styled.p<{ layoutActive: boolean }>`
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  font-weight: 500;
  color: var(--colors-ui-content-heading-sub-section-heading);
  opacity: ${(props) => (props.layoutActive ? "1" : "0.7")};
`;

export const TemplateLayoutRowItemDescription = styled.p<{
  layoutActive: boolean;
}>`
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  font-weight: 400;
  color: var(--colors-ui-content-supplementary);
  opacity: ${(props) => (props.layoutActive ? "1" : "0.7")};
`;

export const TemplateLayoutOrText = styled.p<{ layoutActive: boolean }>`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  margin: 16px 0px;
  opacity: ${(props) => (props.layoutActive ? "0" : "0.7")};
  transition: opacity 0.3s ease;
`;

export const TemplateLayoutDragAndDropText = styled.p<{
  layoutActive: boolean;
}>`
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  opacity: ${(props) => (props.layoutActive ? "0" : "0.7")};
  transition: opacity 0.3s ease;
`;

export const TemplateLayoutContentGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 12px;
`;

export const TemplateLayoutContentItem = styled.div`
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 4px;
  background: transparent;
  transition: background 0.3s ease;
  cursor: pointer;
  width: 156px;
  height: 156px;
  border-width: 1px;
  border-color: ${Colors.GEYSER};

  &:hover {
    background: rgba(241, 245, 249, 1);
  }
`;

export const TemplateLayoutContentItemContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const IconContainer = styled.div<{ layoutItemActive: boolean }>`
  border-width: 1px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-color: ${(props) =>
    props.layoutItemActive ? Colors.PRIMARY_ORANGE : "transparent"};
`;
