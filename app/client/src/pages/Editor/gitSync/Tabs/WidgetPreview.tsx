import { RenderModes } from "constants/WidgetConstants";
import React, { useMemo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import styled from "styled-components";

const widgetDSLWrapper = {
  children: [],
  topRow: 0,
  type: "CANVAS_WIDGET",
  widgetId: "0",
};

// const widgetStructure = {
//   children: [
//     {
//       mobileBottomRow: 9,
//       widgetName: "Text2",
//       displayName: "Text",
//       iconSVG: "/static/media/icon.c3b6033f570046f8c6288d911333a827.svg",
//       searchTags: ["typography", "paragraph", "label"],
//       topRow: 7,
//       bottomRow: 11,
//       parentRowSpace: 10,
//       type: "TEXT_WIDGET",
//       hideCard: false,
//       mobileRightColumn: 16,
//       animateLoading: true,
//       overflow: "NONE",
//       fontFamily: "System Default",
//       parentColumnSpace: 12.65625,
//       dynamicTriggerPathList: [],
//       leftColumn: 22,
//       dynamicBindingPathList: [
//         { key: "truncateButtonColor" },
//         { key: "fontFamily" },
//         { key: "borderRadius" },
//       ],
//       shouldTruncate: false,
//       truncateButtonColor: "#FFC13D",
//       text: "This is a sample home page.",
//       key: "xp9u5r1i3j",
//       isDeprecated: false,
//       rightColumn: 41,
//       textAlign: "CENTER",
//       dynamicHeight: "AUTO_HEIGHT",
//       widgetId: "0y98b33rwi",
//       minWidth: 450,
//       isVisible: true,
//       fontStyle: "BOLD",
//       textColor: "#231F20",
//       version: 1,
//       parentId: "0",
//       renderMode: "CANVAS",
//       isLoading: false,
//       mobileTopRow: 5,
//       responsiveBehavior: "fill",
//       originalTopRow: 7,
//       borderRadius: "4px",
//       mobileLeftColumn: 0,
//       maxDynamicHeight: 9000,
//       originalBottomRow: 11,
//       fontSize: "0.875rem",
//       minDynamicHeight: 4,
//       skipWidgetPropsHydration: true,
//       resizeDisabled: true,
//     },
//   ],
//   topRow: 0,
//   type: "CANVAS_WIDGET",
//   widgetId: "0",
// };
// skipWidgetPropsHydration: true,
// resizeDisabled: true,

// const widgetStructure = {
//   resetFormOnClick: false,
//   boxShadow: "none",
//   mobileBottomRow: 16,
//   widgetName: "Button1",
//   buttonColor: "{{appsmith.theme.colors.primaryColor}}",
//   displayName: "Button",
//   iconSVG:
//     "https://release-appcdn.appsmith.com/static/media/icon.7beb9123fb53027d9d6b778cdfe4caed.svg",
//   searchTags: ["click", "submit"],
//   topRow: 15,
//   bottomRow: 19,
//   parentRowSpace: 10,
//   type: "BUTTON_WIDGET",
//   hideCard: false,
//   mobileRightColumn: 16,
//   animateLoading: true,
//   parentColumnSpace: 12.65625,
//   dynamicTriggerPathList: [],
//   leftColumn: 23,
//   dynamicBindingPathList: [{ key: "buttonColor" }, { key: "borderRadius" }],
//   text: "Looks Fantastic!",
//   isDisabled: false,
//   key: "enmxsm5afm",
//   isDeprecated: false,
//   rightColumn: 39,
//   isDefaultClickDisabled: true,
//   widgetId: "jbvgc3ae0a",
//   minWidth: 120,
//   isVisible: true,
//   recaptchaType: "V3",
//   version: 1,
//   parentId: "0",
//   renderMode: "CANVAS",
//   isLoading: false,
//   mobileTopRow: 12,
//   responsiveBehavior: "hug",
//   originalTopRow: 15,
//   disabledWhenInvalid: false,
//   borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
//   mobileLeftColumn: 0,
//   originalBottomRow: 19,
//   buttonVariant: "PRIMARY",
//   placement: "CENTER",
// };
const Wrapper = styled.div<{ widgetId: string }>`
  ${(props) => {
    return `
    .appsmith_widget_${props.widgetId} {
        position: static !important;
        left: 0 !important;
        top: 0 !important;
      }
      `;
  }}

  .drop-target-0 {
    height: unset !important;
  }
`;

interface WidgetPreviewProps {
  widgetDSL: any;
}

function WidgetPreview(props: WidgetPreviewProps) {
  const { widgetId } = props.widgetDSL;

  const finalDSL = useMemo(() => {
    return {
      ...widgetDSLWrapper,
      children: [
        {
          ...props.widgetDSL,
          skipWidgetPropsHydration: true,
          resizeDisabled: true,
        },
      ],
    };
  }, [props.widgetDSL]);

  return (
    <Wrapper widgetId={widgetId}>
      {WidgetFactory.createWidget(finalDSL as any, RenderModes.CANVAS)}
    </Wrapper>
  );
}

export default WidgetPreview;
