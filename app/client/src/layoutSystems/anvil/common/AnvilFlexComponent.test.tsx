import React from "react";
import { render } from "@testing-library/react";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { anvilWidgets } from "widgets/wds/constants";
import { AnvilFlexComponent, getAnvilFlexProps } from "./AnvilFlexComponent";
import { convertFlexGrowToFlexBasis } from "../sectionSpaceDistributor/utils/spaceDistributionEditorUtils";
import { MOBILE_BREAKPOINT } from "../utils/constants";

// Capture the props the wrapper hands to the design-system Flex, so the test checks what the component computes
// rather than how Flex turns props into CSS.
jest.mock("@appsmith/wds", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactLib = require("react");

  return {
    Flex: ReactLib.forwardRef(
      (
        props: {
          children?: React.ReactNode;
          flexBasis?: string;
          width?: string;
        },
        ref: React.Ref<HTMLDivElement>,
      ) => (
        <div
          data-flex-basis={props.flexBasis}
          data-testid="t--test-flex"
          data-width={props.width}
          ref={ref}
        >
          {props.children}
        </div>
      ),
    ),
  };
});

jest.mock("WidgetProvider/factory", () => ({
  __esModule: true,
  default: {
    getConfig: () => ({ responsiveBehavior: ResponsiveBehavior.Fill }),
  },
}));

const zoneSize = {
  minWidth: { base: "100%", [`${MOBILE_BREAKPOINT}px`]: "min-content" },
};

describe("getAnvilFlexProps", () => {
  it("gives a zone with no flexGrow (card / tab body) the full width of its parent", () => {
    const props = getAnvilFlexProps({
      isFillWidget: true,
      verticalAlignment: FlexVerticalAlignment.Top,
      widgetSize: zoneSize,
      widgetType: anvilWidgets.ZONE_WIDGET,
    });

    expect(props.width).toBe("100%");
    // The mobile rule and the fill behaviour are untouched.
    expect(props.minWidth).toEqual(zoneSize.minWidth);
    expect(props.flexGrow).toBe(1);
    expect(props.flexBasis).toBe("0%");
  });

  it("keeps a section zone (with flexGrow) sized by its column basis", () => {
    const props = getAnvilFlexProps({
      flexGrow: 6,
      isFillWidget: true,
      verticalAlignment: FlexVerticalAlignment.Top,
      widgetSize: zoneSize,
      widgetType: anvilWidgets.ZONE_WIDGET,
    });

    expect(props.width).toBe("fit-content");
    expect(props.flexBasis).toBe(convertFlexGrowToFlexBasis(6));
  });

  it("keeps other widgets fit-content wide", () => {
    for (const widgetType of [
      anvilWidgets.SECTION_WIDGET,
      "WDS_SELECT_WIDGET",
      "WDS_BUTTON_WIDGET",
    ]) {
      const props = getAnvilFlexProps({
        isFillWidget: false,
        verticalAlignment: FlexVerticalAlignment.Top,
        widgetType,
      });

      expect(props.width).toBe("fit-content");
      expect(props.flexBasis).toBe("auto");
    }
  });
});

describe("AnvilFlexComponent", () => {
  function renderZone(flexGrow?: number) {
    const { getByTestId } = render(
      <AnvilFlexComponent
        flexGrow={flexGrow}
        isVisible
        layoutId="layout-1"
        rowIndex={0}
        widgetId="zone-1"
        widgetName="Zone1"
        widgetType={anvilWidgets.ZONE_WIDGET}
      >
        <span />
      </AnvilFlexComponent>,
    );

    return getByTestId("t--test-flex");
  }

  it("renders a zone without flexGrow at full width", () => {
    expect(renderZone().getAttribute("data-width")).toBe("100%");
  });

  it("passes flexGrow through so a section zone keeps its column basis", () => {
    const flex = renderZone(6);

    expect(flex.getAttribute("data-width")).toBe("fit-content");
    expect(flex.getAttribute("data-flex-basis")).toBe(
      convertFlexGrowToFlexBasis(6),
    );
  });
});
