import styled from "styled-components";
import { PopoverContent } from "../../../Popover";

export const SwitchTrigger = styled.div<{ active: boolean }>`
  display: flex;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.active ? `var(--ads-v2-color-bg-subtle)` : "unset"};
  cursor: pointer;
  padding: var(--ads-v2-spaces-2);

  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

export const ContentContainer = styled(PopoverContent)`
  padding: 0;
  padding-bottom: 0.25em;
`;
