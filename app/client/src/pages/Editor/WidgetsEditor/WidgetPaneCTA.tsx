import React, { useEffect, useRef } from "react";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import { useDispatch, useSelector } from "react-redux";
import DashboardLine from "remixicon-react/DashboardLineIcon";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { getDragDetails } from "sagas/selectors";
import { AppState } from "@appsmith/reducers";
import { useMouseLocation } from "../GlobalHotKeys/useMouseLocation";
import styled from "styled-components";
import {
  Icon,
  IconSize,
  TooltipComponent,
  Text,
  IconWrapper,
  TextType,
} from "design-system-old";
import { Popover2 } from "@blueprintjs/popover2";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { selectForceOpenWidgetPanel } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import {
  ADD_WIDGET_TOOLTIP,
  createMessage,
  WIDGET_USED,
} from "@appsmith/constants/messages";
import {
  getExplorerActive,
  getExplorerPinned,
} from "selectors/explorerSelector";

const WIDGET_PANE_WIDTH = 246;
const WIDGET_PANE_HEIGHT = 600;

const StyledTrigger = styled.div<{ active: boolean }>`
  height: ${(props) => props.theme.widgetTopBar};

  :hover {
    background-color: ${Colors.GRAY_100};
  }
  :active {
    background-color: ${Colors.GREY_200};
  }

  ${(props) =>
    props.active &&
    `
  background-color: ${Colors.GREY_200};
  `}

  cursor: pointer;
`;

const PopoverContentWrapper = styled.div<{ isInGuidedTour: boolean }>`
  display: flex;
  width: 246px;
  height: min(70vh, 600px);

  ${(props) =>
    props.isInGuidedTour &&
    `
    height: min(60vh, 600px);
  `}
`;

const StyledIconWrapper = styled(IconWrapper)`
  svg {
    width: 12px;
    height: 12px;
  }
`;

function WidgetPaneTrigger() {
  const dispatch = useDispatch();
  const openWidgetPanel = useSelector(selectForceOpenWidgetPanel);
  const pinned = useSelector(getExplorerPinned);
  const active = useSelector(getExplorerActive);
  const dragDetails = useSelector(getDragDetails);
  const getMousePosition = useMouseLocation();
  const ref = useRef<HTMLDivElement | null>(null);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isInGuidedTour = useSelector(inGuidedTour);
  const toOpen = useRef(false);

  const isOverlappingWithPane = () => {
    const { x, y } = getMousePosition();
    let ctaPosition = { left: 0, top: 0 };

    if (ref.current) {
      ctaPosition = ref.current.getBoundingClientRect();
    }
    // Horizontal buffer distance
    const hbufferOffset = 200;
    // The distance from the left of the viewport + buffer + widget pane width
    // If the cursor is in this area we don't open the pane after drop
    const hOffset = ctaPosition.left + hbufferOffset + WIDGET_PANE_WIDTH;
    const vOffset = ctaPosition.top + WIDGET_PANE_HEIGHT;
    // The CTA is always on the left and top of the canvas.
    if (x < hOffset && y < vOffset) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!pinned && active && openWidgetPanel) {
      dispatch(forceOpenWidgetPanel(false));
    }
  }, [pinned, active, openWidgetPanel]);

  // To close the pane when we see a drag of a new widget
  useEffect(() => {
    if (isDragging && dragDetails.newWidget && openWidgetPanel) {
      toOpen.current = true;
      dispatch(forceOpenWidgetPanel(false));
    }
  }, [isDragging, dragDetails.newWidget, openWidgetPanel]);

  // To open the pane on drop
  useEffect(() => {
    if (!isDragging && toOpen.current) {
      if (!isOverlappingWithPane() && !isInGuidedTour) {
        toOpen.current = false;
        dispatch(forceOpenWidgetPanel(true));
      }
    }
  }, [isDragging, isInGuidedTour]);

  return (
    <div className="widget-pane">
      <Popover2
        canEscapeKeyClose
        content={
          <PopoverContentWrapper isInGuidedTour>
            <WidgetSidebar isActive />
          </PopoverContentWrapper>
        }
        isOpen={openWidgetPanel}
        minimal
        modifiers={{
          offset: {
            enabled: true,
            options: {
              offset: [13, 0],
            },
          },
        }}
        onClose={() => dispatch(forceOpenWidgetPanel(false))}
        placement="bottom-start"
      >
        <TooltipComponent
          boundary="viewport"
          content={createMessage(ADD_WIDGET_TOOLTIP)}
          disabled={openWidgetPanel}
          position="bottom-left"
        >
          <StyledTrigger
            active={openWidgetPanel}
            className="flex ml-3 justify-center items-center gap-1 px-1"
            data-cy="widget-page-cta"
            onClick={() => dispatch(forceOpenWidgetPanel(true))}
            ref={ref}
          >
            <StyledIconWrapper fillColor={Colors.GRAY_700} size={IconSize.XXS}>
              <DashboardLine />
            </StyledIconWrapper>

            <Text color={Colors.GRAY_700} type={TextType.P3}>
              {createMessage(WIDGET_USED)}
            </Text>
            <Icon
              fillColor={Colors.GREY_7}
              name="arrow-down-s-fill"
              size={IconSize.XXS}
            />
          </StyledTrigger>
        </TooltipComponent>
      </Popover2>
    </div>
  );
}

export default WidgetPaneTrigger;
