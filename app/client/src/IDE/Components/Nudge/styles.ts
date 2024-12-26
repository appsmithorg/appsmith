import styled from "styled-components";
import {
  Icon,
  PopoverContent as ADSPopoverContent,
  PopoverTrigger as ADSPopoverTrigger,
} from "@appsmith/ads";

export const PopoverContent = styled(ADSPopoverContent)`
  background: var(--ads-v2-color-bg-emphasis-max);
  box-shadow: 0 1px 20px 0 #4c56641c;
  border: none;
  transform-origin: var(--radix-popover-content-transform-origin);
  animation: fadeIn 0.2s cubic-bezier(0, 0, 0.58, 1);

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const PopoverTrigger = styled(ADSPopoverTrigger)`
  border: 2px solid transparent !important;

  &[data-active="true"] {
    border: 2px solid var(--ads-v2-color-blue-300) !important;
  }

  transition: border 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
`;

export const CloseIcon = styled(Icon)`
  svg {
    path {
      fill: #ffffff;
    }
  }

  padding: var(--ads-v2-spaces-2);
  cursor: pointer;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: #ffffff33;
  }
`;
