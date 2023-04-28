import styled, { css } from "styled-components";
import type { DynamicContainerComponentProps } from "../constants";
import {
  DYNAMIC_CONTAINER_CLASS,
  DynamicContainerLayoutPercentages,
} from "../constants";
import { RenderModes } from "constants/WidgetConstants";
import { POSITIONED_WIDGET } from "constants/componentClassNameConstants";

function getStylesForLayout([firstCol, secondCol, thirdCol]: number[]) {
  firstCol ??= 0;
  secondCol ??= 0;
  thirdCol ??= 0;
  return css`
    .${DYNAMIC_CONTAINER_CLASS} {
      display: grid;
      grid-template-columns: ${firstCol}% ${secondCol}% ${thirdCol}%;
      gap: 0;
      grid-template-rows: 1fr;

      > *.${POSITIONED_WIDGET} {
        &:nth-of-type(1),
        &:nth-of-type(2),
        &:nth-of-type(3) {
          position: unset !important;
          height: unset !important;
          width: unset !important;
        }

        // FIXME: There is a issue in the UI when any widget in the canvas is dragged because 2 elements (<canvas> and
        //  <div>) are appended into the DOM becoming 1st and 2nd children of .positioned-widget.
        &:nth-of-type(1) {
          ${(firstCol && `grid-column:1/2; grid-row:1/2;`) || `display:none;`}
        }

        &:nth-of-type(2) {
          ${(secondCol && `grid-column:2/3; grid-row:1/2;`) || `display:none;`}
        }

        &:nth-of-type(3) {
          ${(thirdCol && `grid-column:3/4; grid-row:1/2;`) || `display:none;`}
        }
      }
    }
  `;
}

function dynamicContainerConditionalStyle(
  props: DynamicContainerComponentProps,
) {
  if (props.renderMode === RenderModes.CANVAS && !props.previewLayoutInCanvas)
    return "";

  const layoutPercentages = DynamicContainerLayoutPercentages[props.layout];
  if (!layoutPercentages) return "";

  return getStylesForLayout(layoutPercentages);
}

const DynamicContainerComponent = styled.div<DynamicContainerComponentProps>`
  ${(props: DynamicContainerComponentProps) =>
    dynamicContainerConditionalStyle(props)}
`;

export default DynamicContainerComponent;
