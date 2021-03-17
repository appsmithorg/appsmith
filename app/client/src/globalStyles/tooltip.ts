import { createGlobalStyle } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { Classes } from "@blueprintjs/core";
import { Classes as CsClasses } from "components/ads/common";

export const GLOBAL_STYLE_TOOLTIP_CLASSNAME = "ads-global-tooltip";

export const TooltipStyles = createGlobalStyle<{
  theme: Theme;
}>`
  .${Classes.PORTAL} {
    .${Classes.TOOLTIP}.${GLOBAL_STYLE_TOOLTIP_CLASSNAME} {
      .${Classes.POPOVER_CONTENT} {
        padding: 10px 12px;
        border-radius: 0px;
        background-color: ${(props) => props.theme.colors.tooltip.darkBg};
        color: ${(props) => props.theme.colors.tooltip.darkText};
        box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
      }
      div.${Classes.POPOVER_ARROW} {
        path {
          fill: ${(props) => props.theme.colors.tooltip.darkBg};
          stroke: ${(props) => props.theme.colors.tooltip.darkBg};
        }
        display: block;
      }
      .${CsClasses.BP3_POPOVER_ARROW_BORDER},
      .${CsClasses.BP3_POPOVER_ARROW_FILL} {
        fill: ${(props) => props.theme.colors.tooltip.darkBg};
      }
    }
  }
`;
