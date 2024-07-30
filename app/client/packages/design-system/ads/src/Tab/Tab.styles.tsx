import styled, { css } from "styled-components";
import * as RadixTabs from "@radix-ui/react-tabs";

const Variables = css`
  --ads-v2-colors-content-tab-baseline-default-border: var(
    --ads-v2-color-border
  );
  --ads-v2-colors-content-tab-surface-default-border: transparent;
  --ads-v2-colors-content-tab-surface-hover-border: var(
    --ads-v2-color-border-emphasis
  );
  --ads-v2-colors-content-tab-surface-active-border: var(
    --ads-v2-color-border-brand
  );
  --ads-v2-colors-content-tag-background-default-bg: var(--ads-v2-color-bg);

  --tab-color: var(--ads-v2-colors-content-label-inactive-fg);
  --tab-selection-color: var(
    --ads-v2-colors-content-tab-surface-default-border
  );
`;

export const StyledTabs = styled(RadixTabs.Root)`
  max-height: fit-content;
  width: 100%;
`;

export const StyledTabsList = styled(RadixTabs.List)`
  ${Variables};
  display: flex;
  background-color: var(--ads-v2-colors-content-tag-background-default-bg);
  border-bottom: 1px solid
    var(--ads-v2-colors-content-tab-baseline-default-border);
  display: flex;
  gap: var(--ads-v2-spaces-4);
  width: 100%;
  overflow: auto;
  padding: var(--ads-v2-spaces-1);
`;

export const StyledTabPanel = styled(RadixTabs.Content)`
  margin-top: var(--ads-v2-spaces-4);
`;
export const StyledTab = styled(RadixTabs.TabsTrigger)`
  ${Variables};

  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  cursor: pointer;
  padding: var(--ads-v2-spaces-2);
  padding-bottom: var(--ads-v2-spaces-3);
  background-color: var(--ads-v2-colors-content-tag-background-default-bg);
  border: none; // get rid of button styles
  color: var(--tab-color);
  min-width: fit-content;
  border-radius: var(--ads-v2-border-radius);

  &:after {
    content: "";
    height: 2px;
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    background-color: var(--tab-selection-color);
  }

  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);

  &:hover {
    --tab-selection-color: var(
      --ads-v2-colors-content-tab-surface-hover-border
    );
  }

  &[aria-selected="true"],
  &:active {
    --tab-selection-color: var(
      --ads-v2-colors-content-tab-surface-active-border
    );
    --tab-color: var(--ads-v2-colors-content-label-default-fg);
  }

  &:focus-visible {
    --tab-color: var(--ads-v2-colors-content-label-default-fg);
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;
