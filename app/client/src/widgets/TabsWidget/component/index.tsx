import React, {
  RefObject,
  ReactNode,
  useRef,
  useState,
  useCallback,
} from "react";
import styled, { css } from "styled-components";
import { MaybeElement } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { ComponentProps } from "widgets/BaseComponent";
import { TabsWidgetProps, TabContainerWidgetProps } from "../constants";
import Icon, { IconSize } from "components/ads/Icon";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { Colors } from "constants/Colors";
import PageTabs from "./PageTabs";

interface TabsComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  selectedTabWidgetId: string;
  shouldShowTabs: boolean;
  borderRadius: string;
  boxShadow?: string;
  primaryColor: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    widgetId: string;
    isVisible?: boolean;
  }>;
  width: number;
}

type ChildrenWrapperProps = Pick<TabsComponentProps, "shouldShowTabs">;

const TAB_CONTAINER_HEIGHT = "44px";
const CHILDREN_WRAPPER_HEIGHT_WITH_TABS = `calc(100% - ${TAB_CONTAINER_HEIGHT})`;
const CHILDREN_WRAPPER_HEIGHT_WITHOUT_TABS = "100%";

// const scrollNavControlContainerBaseStyle = css`
//   display: flex;
//   position: absolute;
//   top: 0;
//   bottom: 0;
//   z-index: 2;
//   background: white;

//   button {
//     z-index: 1;
//     border-radius: 0px;
//     border-bottom: ${(props) => `1px solid ${props.theme.colors.bodyBG}`};
//   }
// `;

const scrollContents = css`
  overflow-y: auto;
  position: absolute;
`;

const TabsContainerWrapper = styled.div<{
  ref: RefObject<HTMLDivElement>;
  borderRadius: string;
  boxShadow?: string;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  overflow: hidden;
  background: white;
`;

const ChildrenWrapper = styled.div<ChildrenWrapperProps>`
  position: relative;
  height: ${({ shouldShowTabs }) =>
    shouldShowTabs
      ? CHILDREN_WRAPPER_HEIGHT_WITH_TABS
      : CHILDREN_WRAPPER_HEIGHT_WITHOUT_TABS};
  width: 100%;
  background: ${(props) => props.theme.colors.builderBodyBG};
`;

const ScrollableCanvasWrapper = styled.div<
  TabsWidgetProps<TabContainerWidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollContents : "")}
`;

export interface TabsContainerProps {
  isScrollable: boolean;
}

// const TabsContainer = styled.div<TabsContainerProps>`
//   position: absolute;
//   top: 0;
//   overflow-x: auto;
//   overflow-y: hidden;
//   display: flex;
//   height: ${TAB_CONTAINER_HEIGHT};
//   background: ${(props) => props.theme.colors.builderBodyBG};
//   overflow: hidden;
//   border-bottom: ${(props) => `1px solid ${props.theme.colors.bodyBG}`};

//   overflow-x: scroll;
//   &::-webkit-scrollbar {
//     display: none;
//   }
//   /* Hide scrollbar for IE, Edge and Firefox */
//   -ms-overflow-style: none; /* IE and Edge */
//   scrollbar-width: none; /* Firefox */

//   && {
//     width: 100%;
//     display: flex;
//     justify-content: flex-start;
//     align-items: flex-end;
//   }
// `;

// type TabProps = {
//   selected?: boolean;
//   onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
//   primaryColor: string;
// };

const Container = styled.div`
  width: 100%;
  align-items: flex-end;
  height: 44px;

  & {
    svg path,
    svg:hover path {
      fill: ${Colors.BLACK};
      stroke: ${(props) => props.theme.colors.header.tabText};
    }
  }
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const ScrollBtnContainer = styled.div<{ visible: boolean }>`
  cursor: pointer;
  display: flex;
  position: absolute;
  height: 34px;
  padding: 0 10px;

  & > span {
    background: white;
    position: relative;
    z-index: 1;
  }

  ${(props) =>
    props.visible
      ? `
      visibility: visible;
      opacity: 1;
      z-index: 1;
      transition: visibility 0s linear 0s, opacity 300ms;
    `
      : `
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s linear 300ms, opacity 300ms;
    `}
`;

export interface ScrollNavControlProps {
  onClick: () => void;
  icon: IconName | MaybeElement;
  disabled?: boolean;
  className?: string;
}

// function ScrollNavControl(props: ScrollNavControlProps) {
//   const { className, disabled, icon, onClick } = props;
//   return (
//     <Button
//       className={className}
//       disabled={disabled}
//       icon={icon}
//       minimal
//       onClick={onClick}
//     />
//   );
// }

function TabsComponent(props: TabsComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onTabChange, tabs, width, ...remainingProps } = props;
  const tabContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(
    null,
  );
  const tabsRef = useRef<HTMLElement | null>(null);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  const [shouldShowLeftArrow, setShouldShowLeftArrow] = useState(false);
  const [shouldShowRightArrow, setShouldShowRightArrow] = useState(true);

  const setShowScrollArrows = useCallback(() => {
    if (tabsRef.current) {
      const { offsetWidth, scrollLeft, scrollWidth } = tabsRef.current;
      setShouldShowLeftArrow(scrollLeft > 0);
      setShouldShowRightArrow(scrollLeft + offsetWidth < scrollWidth);
    }
  }, [tabsRef.current, tabs]);

  const measuredTabsRef = useCallback(
    (node) => {
      tabsRef.current = node;
      if (node !== null) {
        const { offsetWidth, scrollWidth } = node;
        setTabsScrollable(scrollWidth > offsetWidth);
        setShowScrollArrows();
      }
    },
    [tabs],
  );

  const scroll = useCallback(
    (isScrollingLeft) => {
      const currentOffset = tabsRef.current?.scrollLeft || 0;

      if (tabsRef.current) {
        tabsRef.current.scrollLeft = isScrollingLeft
          ? currentOffset - 50
          : currentOffset + 50;
        setShowScrollArrows();
      }
    },
    [tabsRef.current],
  );
  // eslint-disable-next-line
  // const [_intervalRef, _rafRef, requestAF] = useThrottledRAF(scroll, 10);

  // useEffect(() => {
  //   if (!props.shouldScrollContents) {
  //     tabContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // }, [props.shouldScrollContents]);

  return (
    <TabsContainerWrapper
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      ref={tabContainerRef}
    >
      {props.shouldShowTabs && (
        <Container className="relative flex px-6 h-9">
          <ScrollBtnContainer
            className="left-0 cursor-pointer scroll-nav-left-button"
            onClick={() => scroll(true)}
            visible={shouldShowLeftArrow}
          >
            <Icon name="left-arrow-2" size={IconSize.MEDIUM} />
          </ScrollBtnContainer>
          <PageTabs
            measuredTabsRef={measuredTabsRef}
            selectedTabWidgetId={props.selectedTabWidgetId}
            setShowScrollArrows={setShowScrollArrows}
            tabChange={onTabChange}
            tabs={tabs}
            tabsScrollable={tabsScrollable}
          />
          <ScrollBtnContainer
            className="right-0 cursor-pointer scroll-nav-right-button"
            onClick={() => scroll(false)}
            visible={shouldShowRightArrow}
          >
            <Icon name="right-arrow-2" size={IconSize.MEDIUM} />
          </ScrollBtnContainer>
        </Container>
      )}

      <ChildrenWrapper shouldShowTabs={props.shouldShowTabs}>
        <ScrollableCanvasWrapper
          {...remainingProps}
          className={`${
            props.shouldScrollContents ? getCanvasClassName() : ""
          } ${generateClassName(props.widgetId)}`}
        >
          {props.children}
        </ScrollableCanvasWrapper>
      </ChildrenWrapper>
    </TabsContainerWrapper>
  );
}

export default TabsComponent;
