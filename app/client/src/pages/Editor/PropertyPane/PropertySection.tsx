import { Classes } from "@blueprintjs/core";
import type { ReactNode, Context } from "react";
import React, {
  memo,
  useState,
  useEffect,
  createContext,
  useCallback,
} from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Icon, Tag, Tooltip } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import { useDispatch, useSelector } from "react-redux";
import { getPropertySectionState } from "selectors/editorContextSelectors";
import { getCurrentWidgetId } from "selectors/propertyPaneSelectors";
import { setPropertySectionState } from "actions/propertyPaneActions";
import { getIsOneClickBindingOptionsVisibility } from "selectors/oneClickBindingSelectors";
import localStorage from "utils/localStorage";
import { WIDGET_ID_SHOW_WALKTHROUGH } from "constants/WidgetConstants";
import { PROPERTY_PANE_ID } from "components/editorComponents/PropertyPaneSidebar";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";

const TagContainer = styled.div``;

const SectionTitle = styled.span`
  color: var(--ads-v2-color-gray-600);
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-bold);
  margin-right: 8px;
`;

const SectionWrapper = styled.div`
  position: relative;
  border-top: 1px solid var(--ads-v2-color-border);
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
    ${TagContainer} {
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

interface PropertySectionProps {
  id: string;
  name: string;
  childrenId?: string;
  collapsible?: boolean;
  children?: ReactNode;
  childrenWrapperRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hidden?: (props: any, propertyPath: string) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabled?: (props: any, propertyPath: string) => boolean;
  disabledHelpText?: string;
  isDefaultOpen?: boolean;
  propertyPath?: string;
  tag?: string; // Used to show a tag on the section title on search results
  panelPropertyPath?: string;
}

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id && prev.childrenId === next.childrenId;
};

// Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext: Context<boolean> = createContext<boolean>(false);
export const DisabledContext: Context<boolean> = createContext<boolean>(false);

export const PropertySection = memo((props: PropertySectionProps) => {
  const dispatch = useDispatch();
  const currentWidgetId = useSelector(getCurrentWidgetId);
  const { isDefaultOpen } = props;
  const isContextOpen = useSelector((state: AppState) =>
    getPropertySectionState(state, {
      key: `${currentWidgetId}.${props.id}`,
      panelPropertyPath: props.panelPropertyPath,
    }),
  );
  const isSearchResult = props.tag !== undefined;
  const [isOpen, setIsOpen] = useState(!!isContextOpen);
  
  const widgetProps = useSelector(getWidgetPropsForPropertyPane);
  const isSectionDisabled = props.disabled && props.disabled(widgetProps, props.propertyPath || "");

  const className = props.name.split(" ").join("").toLowerCase();
  const connectDataClicked = useSelector(getIsOneClickBindingOptionsVisibility);

  useEffect(() => {
    if (connectDataClicked && className === "data" && !isOpen) {
      handleSectionTitleClick();
    }
  }, [connectDataClicked]);

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

  useEffect(() => {
    let initialIsOpenState = true;

    if (isSearchResult) {
      initialIsOpenState = true;
    } else if (isContextOpen !== undefined) {
      initialIsOpenState = isContextOpen;
    } else {
      initialIsOpenState = !!isDefaultOpen;
    }

    setIsOpen(initialIsOpenState);
  }, [isContextOpen, isSearchResult, isDefaultOpen]);

  // If the walkthrough is opened for widget Id, then only open the data section of property pane and collapse other sections.
  const enableDataSectionOnly = async () => {
    const widgetId: string | null = await localStorage.getItem(
      WIDGET_ID_SHOW_WALKTHROUGH,
    );

    if (widgetId) {
      const isWidgetIdTableDataExist = document.querySelector(
        `#${PROPERTY_PANE_ID} [id='${btoa(widgetId + ".tableData")}']`,
      );

      if (isWidgetIdTableDataExist) {
        if (className === "data") {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } else {
        await localStorage.removeItem(WIDGET_ID_SHOW_WALKTHROUGH);
      }
    }
  };

  useEffect(() => {
    enableDataSectionOnly();
  }, []);

  if (!currentWidgetId) return null;

  const sectionContent = (
    <SectionWrapper
    className={`t--property-pane-section-wrapper ${props.className} ${isSectionDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
  >
    <div
      className={`section-title-wrapper t--property-pane-section-collapse-${className} flex items-center ${
        !props.tag && !isSectionDisabled ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={!isSectionDisabled ? handleSectionTitleClick : undefined}
    >
      <SectionTitle>{props.name}</SectionTitle>
      {props.tag && (
        <TagContainer>
          <Tag
            className={`capitalize t--property-section-tag-${props.tag}`}
            isClosable={false}
          >
            {props.tag.toLowerCase()}
          </Tag>
        </TagContainer>
      )}
      {props.collapsible && !isSectionDisabled && (
        <Icon
          className={`ml-auto t--chevron-icon`}
          name={isOpen ? "expand-less" : "expand-more"}
          size="md"
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
  )

  return (
      isSectionDisabled && props.disabledHelpText ? (
        <Tooltip content={props.disabledHelpText}>
        {sectionContent}
        </Tooltip>
      ) : (
        sectionContent
      )
    
  );
}, areEqual);

PropertySection.displayName = "PropertySection";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(PropertySection as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertySection;
