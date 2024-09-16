import styled from "styled-components";
import { Text } from "../Text";
import { Content } from "@radix-ui/react-hover-card";
import { AnnouncementPopoverArrowClassName } from "./AnnouncementPopover.constants";

export const StyledContent = styled(Content)`
  display: flex;
  width: 250px;
  flex-direction: column;
  background-color: var(--ads-v2-colors-content-surface-default-bg);
  border: 1px solid var(--ads-v2-colors-content-container-default-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);
  overflow: hidden;
  z-index: 1001;

  .${AnnouncementPopoverArrowClassName} {
    position: relative;
    transform: rotate(180deg);
    top: -3px;
    visibility: visible;
  }
`;

export const StyledCustomBody = styled.div`
  padding: var(--ads-v2-spaces-7);
`;

export const StyledDescription = styled(Text)`
  display: block;
  margin-top: var(--ads-v2-spaces-3);
  line-height: 20px;
`;

export const StyledTitle = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: 600;
  line-height: 24px;
`;
export const StyledBanner = styled.div<{ backgroundUrl?: string }>`
  height: 150px;
  display: flex;
  justify-content: flex-end;
  background-image: url("${({ backgroundUrl }) => backgroundUrl}");
  background-size: cover;
  padding: var(--ads-v2-spaces-5);
`;

export const StyledFooter = styled.div`
  margin-top: var(--ads-v2-spaces-5);
`;
