import { createGlobalStyle } from "styled-components";
import type { Theme } from "constants/DefaultTheme";
import { Classes } from "@blueprintjs/core";

export const GLOBAL_STYLE_TOOLTIP_CLASSNAME = "ads-global-tooltip";

export const TooltipStyles = createGlobalStyle<{
  theme: Theme;
}>`
  .${Classes.PORTAL} .${Classes.TOOLTIP}.${GLOBAL_STYLE_TOOLTIP_CLASSNAME}, .${Classes.TOOLTIP}.${GLOBAL_STYLE_TOOLTIP_CLASSNAME} {
    max-width: 350px;
      overflow-wrap: anywhere;
      .${Classes.POPOVER_CONTENT} {
        padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
        font-family: var(--ads-v2-font-family);
        color: var(--ads-v2-color-fg-on-emphasis-max);
        border-radius: var(--ads-v2-border-radius);
        background-color: var(--ads-v2-color-bg-emphasis-max);
        min-height: unset;
        box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.1);
        font-size: var(--ads-v2-font-size-2);
        font-weight: var(--ads-v2-p-font-weight);
        margin: 0;
        letter-spacing: var(--ads-v2-p-letter-spacing);
      }
      div.${Classes.POPOVER_ARROW} {
        display: block;
        svg {
          path {
            fill: var(--ads-v2-color-bg-emphasis-max)
          }
        }
        &:before {
          box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.1);
        }
      }
  }
`;
