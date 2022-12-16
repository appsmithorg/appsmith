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
import { AppState } from "@appsmith/reducers";
import { useDispatch, useSelector } from "react-redux";
import { getPropertySectionState } from "selectors/editorContextSelectors";
import { getCurrentWidgetId } from "selectors/propertyPaneSelectors";
import { setPropertySectionState } from "actions/propertyPaneActions";

const Label = styled.div`
  font-size: 11px;
  background: ${Colors.GRAY_100};
  color: ${Colors.GRAY_600};
  padding: 2px 4px;
`;

const SectionTitle = styled.span`
  color: ${Colors.GRAY_800};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  font-weight: 500;
  margin-right: 8px;
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
    ${Label} {
      display: none;
    }
  }

  & & .section-title-wrapper {
    margin-top: 10px;
    margin-bottom: 7px;
  }

  & & .section-title-wrapper span {
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
  margin-left: auto;
  svg path {
    fill: ${Colors.GRAY_700};
  }
`;

type PropertySectionProps = {
  id: string;
  name: string;
  childrenId?: string;
  collapsible?: boolean;
  children?: ReactNode;
  childrenWrapperRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  hidden?: (props: any, propertyPath: string) => boolean;
  isDefaultOpen?: boolean;
  propertyPath?: string;
  tag?: string; // Used to show a tag on the section title on search results
  panelPropertyPath?: string;
};

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id && prev.childrenId === next.childrenId;
};

//Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext: Context<boolean> = createContext<boolean>(false);

export const PropertySection = memo((props: PropertySectionProps) => {
  const dispatch = useDispatch();
  const currentWidgetId = useSelector(getCurrentWidgetId);
  const { isDefaultOpen = true } = props;
  const isDefaultContextOpen = useSelector(
    (state: AppState) =>
      getPropertySectionState(state, {
        key: `${currentWidgetId}.${props.id}`,
        panelPropertyPath: props.panelPropertyPath,
      }),
    () => true,
  );
  const isSearchResult = props.tag !== undefined;
  let initialIsOpenState = true;
  if (isSearchResult) {
    initialIsOpenState = true;
  } else if (isDefaultContextOpen !== undefined) {
    initialIsOpenState = isDefaultContextOpen;
  } else {
    initialIsOpenState = !!isDefaultOpen;
  }
  const [isOpen, setIsOpen] = useState(initialIsOpenState);

  const handleSectionTitleClick = useCallback(() => {
    if (props.collapsible)
      setIsOpen((x) => {
        dispatch(
          setPropertySectionState(
            `${currentWidgetId}.${props.id}`,
            !x,
            props.panelPropertyPath,
          ),
        );
        return !x;
      });
  }, [props.collapsible, props.id, currentWidgetId]);

  if (!currentWidgetId) return null;

  const className = props.name
    .split(" ")
    .join("")
    .toLowerCase();
  return (
    <SectionWrapper
      className={`t--property-pane-section-wrapper ${props.className}`}
    >
      <div
        className={`section-title-wrapper t--property-pane-section-collapse-${className} flex items-center ${
          !props.tag ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={handleSectionTitleClick}
      >
        <SectionTitle>{props.name}</SectionTitle>
        {props.tag && (
          <Label className={`t--property-section-tag-${props.tag}`}>
            {props.tag}
          </Label>
        )}
        {props.collapsible && (
          <StyledIcon
            className="t--chevron-icon"
            name={isOpen ? "arrow-down" : "arrow-right"}
            size={Size.small}
          />
        )}
      </div>
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
