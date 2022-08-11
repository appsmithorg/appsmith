import { Classes, Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import React, {
  memo,
  ReactNode,
  useState,
  Context,
  createContext,
  useCallback,
} from "react";
import { Collapse } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { getWidgetParent } from "sagas/selectors";
import { WidgetProps } from "widgets/BaseWidget";

const SectionTitle = styled.div`
  display: grid;
  grid-template-columns: 1fr 30px;
  cursor: pointer;
  & span {
    color: ${(props) => props.theme.colors.propertyPane.title};
    padding: ${(props) => props.theme.spaces[2]}px 0;
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    display: flex;
    font-weight: normal;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
  }
  & span.${Classes.ICON} {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: none;
    &.open-collapse {
      transform: rotate(90deg);
    }
  }
`;

const SectionWrapper = styled.div`
  position: relative;
  border-top: 1px solid ${Colors.GREY_4};
  padding: 4px 16px 8px 16px;

  &:first-of-type {
    border-top: 0;
  }

  /* Referring to a nested SectionWrapper */
  & & {
    padding: 0;
  }

  & & ${SectionTitle} span {
    color: ${Colors.GRAY_700};
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 600;
  }

  .${Classes.COLLAPSE_BODY} {
    z-index: 1;
    position: relative;
    padding-bottom: 4px;
  }

  .bp3-collapse {
    transition: none;
  }
`;

type PropertySectionProps = {
  id: string;
  name: string;
  collapsible?: boolean;
  children?: ReactNode;
  childrenWrapperRef?: React.RefObject<HTMLDivElement>;
  hidden?: (
    props: any,
    propertyPath: string,
    widgetParentProps?: WidgetProps,
  ) => boolean;
  isDefaultOpen?: boolean;
  propertyPath?: string;
};

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id;
};

//Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext: Context<boolean> = createContext<boolean>(false);

export const PropertySection = memo((props: PropertySectionProps) => {
  const { isDefaultOpen = true } = props;
  const [isOpen, setIsOpen] = useState(!!isDefaultOpen);
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);
  const handleSectionTitleClick = useCallback(() => {
    if (props.collapsible) setIsOpen((x) => !x);
  }, []);
  /**
   * get actual parent of widget
   * for button inside form, button's parent is form
   * for button on canvas, parent is main container
   */
  const parentWidget = useSelector(getWidgetParent(widgetProps.widgetId));

  if (props.hidden) {
    if (props.hidden(widgetProps, props.propertyPath || "", parentWidget)) {
      return null;
    }
  }

  const className = props.name
    .split(" ")
    .join("")
    .toLowerCase();
  return (
    <SectionWrapper className="t--property-pane-section-wrapper">
      <SectionTitle
        className={`t--property-pane-section-collapse-${className}`}
        onClick={handleSectionTitleClick}
      >
        <span>{props.name}</span>
        {props.collapsible && (
          <Icon
            className={isOpen ? "open-collapse" : ""}
            icon={IconNames.CHEVRON_RIGHT}
          />
        )}
      </SectionTitle>
      {props.children && (
        <Collapse isOpen={isOpen} keepChildrenMounted transitionDuration={0}>
          <div
            className={`t--property-pane-section-${className}`}
            ref={props.childrenWrapperRef}
            style={{ position: "relative", zIndex: 1 }}
          >
            <CollapseContext.Provider value={isOpen}>
              {props.children}
            </CollapseContext.Provider>
          </div>
        </Collapse>
      )}
    </SectionWrapper>
  );
}, areEqual);

PropertySection.displayName = "PropertySection";

(PropertySection as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertySection;
