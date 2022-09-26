import { Classes } from "@blueprintjs/core";
import React, {
  memo,
  ReactNode,
  useState,
  Context,
  createContext,
  useCallback,
} from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { AppIcon as Icon, Size } from "design-system";

const SectionTitle = styled.div`
  cursor: pointer;
  & span {
    color: ${Colors.GRAY_800};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    display: flex;
    font-weight: 500;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
  }
`;

const SectionWrapper = styled.div`
  position: relative;
  border-top: 1px solid ${Colors.GREY_4};
  padding: 12px 16px;

  &:first-of-type {
    border-top: 0;
  }

  /* Referring to a nested SectionWrapper */
  & & {
    padding: 0;
    margin-top: 8px;
    &:first-of-type {
      margin-top: 0;
    }
  }

  & & ${SectionTitle} {
    margin-top: 10px;
    margin-bottom: 7px;
  }

  & & ${SectionTitle} span {
    color: ${Colors.GRAY_700};
    font-size: 12px;
  }

  .${Classes.COLLAPSE_BODY} {
    z-index: 1;
    position: relative;
    padding: 4px 0;
  }

  .bp3-collapse {
    transition: none;
  }
`;

const StyledIcon = styled(Icon)`
  svg path {
    fill: ${Colors.GRAY_700};
  }
`;

type PropertySectionProps = {
  id: string;
  name: string;
  collapsible?: boolean;
  children?: ReactNode;
  childrenWrapperRef?: React.RefObject<HTMLDivElement>;
  hidden?: boolean;
  isDefaultOpen?: boolean;
  propertyPath?: string;
};

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id && prev.hidden === next.hidden;
};

//Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext: Context<boolean> = createContext<boolean>(false);

export const PropertySection = memo((props: PropertySectionProps) => {
  const { isDefaultOpen = true } = props;
  const [isOpen, setIsOpen] = useState(!!isDefaultOpen);
  const handleSectionTitleClick = useCallback(() => {
    if (props.collapsible) setIsOpen((x) => !x);
  }, []);

  if (props.hidden) {
    return null;
  }

  const className = props.name
    .split(" ")
    .join("")
    .toLowerCase();
  return (
    <SectionWrapper className="t--property-pane-section-wrapper">
      <SectionTitle
        className={`t--property-pane-section-collapse-${className} flex items-center`}
        onClick={handleSectionTitleClick}
      >
        <span className="grow">{props.name}</span>
        {props.collapsible && (
          <StyledIcon
            className="t--chevron-icon"
            name={isOpen ? "arrow-down" : "arrow-right"}
            size={Size.small}
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
