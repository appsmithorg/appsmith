import { Classes, Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import React, { memo, ReactNode, useState } from "react";
import { Collapse } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import styled from "constants/DefaultTheme";

const SectionWrapper = styled.div`
  position: relative;
  .${Classes.COLLAPSE_BODY} {
    z-index: 1;
    position: relative;
  }
`;
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
    transition: transform 0.2s;
    &.open-collapse {
      transform: rotate(90deg);
    }
  }
`;

type PropertySectionProps = {
  id: string;
  name: string;
  children?: ReactNode;
  hidden?: (props: any, propertyPath: string) => boolean;
  isDefaultOpen?: boolean;
  propertyPath?: string;
};

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id;
};

export const PropertySection = memo((props: PropertySectionProps) => {
  const [isOpen, open] = useState(!!props.isDefaultOpen);
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);
  if (props.hidden && props.propertyPath) {
    if (props.propertyPath && props.hidden(widgetProps, props.propertyPath)) {
      return null;
    }
  }
  const className = props.name
    .split(" ")
    .join("")
    .toLowerCase();
  return (
    <SectionWrapper>
      <SectionTitle
        onClick={() => open(!isOpen)}
        className={`t--property-pane-section-collapse-${className}`}
      >
        <span>{props.name}</span>
        <Icon
          icon={IconNames.CHEVRON_RIGHT}
          className={isOpen ? "open-collapse" : ""}
        />
      </SectionTitle>
      {props.children && (
        <Collapse isOpen={isOpen} keepChildrenMounted>
          <div
            className={`t--property-pane-section-${className}`}
            style={{ position: "relative", zIndex: 1 }}
          >
            {props.children}
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
