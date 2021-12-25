import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Alignment, Button, Classes, Menu, MenuItem } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ItemListRenderer, ItemRenderer, Select } from "@blueprintjs/select";

import BaseControl, { ControlProps } from "./BaseControl";
import TooltipComponent from "components/ads/Tooltip";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

const IconSelectContainerStyles = createGlobalStyle<{
  targetWidth: number | undefined;
}>`
  .bp3-select-popover {
    width: ${({ targetWidth }) => targetWidth}px;

    .bp3-input-group {
      margin: 5px !important;
    }
  }
`;

const StyledButton = styled(Button)`
  box-shadow: none !important;
  border: 1px solid ${Colors.GREY_5};
  border-radius: 0;
  height: 36px;
  background-color: #ffffff !important;
  > span.bp3-icon-caret-down {
    color: rgb(169, 167, 167);
  }

  &:hover,
  &:focus {
    border: 1.2px solid var(--appsmith-input-focus-border-color);
  }
`;

const StyledMenu = styled(Menu)`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(50px, auto);
  gap: 8px;
  max-height: 170px !important;
  padding-left: 5px !important;
  padding-right: 5px !important;
  &::-webkit-scrollbar {
    width: 8px;
    background-color: #eeeeee;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: #939090;
  }
`;

const StyledMenuItem = styled(MenuItem)`
  flex-direction: column;
  align-items: center;
  padding: 13px 5px;
  &:active,
  &:hover,
  &.bp3-active {
    background-color: #eeeeee !important;
  }
  > span.bp3-icon {
    margin-right: 0;
    color: #939090 !important;
  }
  > div {
    width: 100%;
    text-align: center;
    color: #939090 !important;
  }
`;

export interface IconSelectControlProps extends ControlProps {
  propertyValue?: IconName;
  defaultIconName?: IconName;
}

export interface IconSelectControlState {
  popoverTargetWidth: number | undefined;
}

const NONE = "(none)";
type IconType = IconName | typeof NONE;
const ICON_NAMES = Object.keys(IconNames).map<IconType>(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
ICON_NAMES.unshift(NONE);

const TypedSelect = Select.ofType<IconType>();

class IconSelectControl extends BaseControl<
  IconSelectControlProps,
  IconSelectControlState
> {
  private iconSelectTargetRef: React.RefObject<HTMLButtonElement>;
  private timer?: number;

  constructor(props: IconSelectControlProps) {
    super(props);
    this.iconSelectTargetRef = React.createRef();
    this.state = { popoverTargetWidth: 0 };
  }

  componentDidMount() {
    this.timer = setTimeout(() => {
      const iconSelectTargetElement = this.iconSelectTargetRef.current;
      this.setState((prevState: IconSelectControlState) => {
        return {
          ...prevState,
          popoverTargetWidth: iconSelectTargetElement?.getBoundingClientRect()
            .width,
        };
      });
    }, 0);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  public render() {
    const { defaultIconName, propertyValue: iconName } = this.props;
    const { popoverTargetWidth } = this.state;
    return (
      <>
        <IconSelectContainerStyles targetWidth={popoverTargetWidth} />
        <TypedSelect
          activeItem={iconName || defaultIconName || NONE}
          className="icon-select-container"
          itemListRenderer={this.renderMenu}
          itemPredicate={this.filterIconName}
          itemRenderer={this.renderIconItem}
          items={ICON_NAMES}
          noResults={<MenuItem disabled text="No results" />}
          onItemSelect={this.handleIconChange}
          popoverProps={{ minimal: true }}
        >
          <StyledButton
            alignText={Alignment.LEFT}
            className={
              Classes.TEXT_OVERFLOW_ELLIPSIS + " " + replayHighlightClass
            }
            elementRef={this.iconSelectTargetRef}
            fill
            icon={iconName || defaultIconName}
            rightIcon="caret-down"
            text={iconName || defaultIconName || NONE}
          />
        </TypedSelect>
      </>
    );
  }

  private renderMenu: ItemListRenderer<IconType> = ({
    items,
    itemsParentRef,
    renderItem,
  }) => {
    const renderedItems = items.map(renderItem).filter((item) => item != null);

    return <StyledMenu ulRef={itemsParentRef}>{renderedItems}</StyledMenu>;
  };

  private renderIconItem: ItemRenderer<IconName | typeof NONE> = (
    icon,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <TooltipComponent content={icon}>
        <StyledMenuItem
          active={modifiers.active}
          icon={icon === NONE ? undefined : icon}
          key={icon}
          onClick={handleClick}
          text={icon === NONE ? NONE : undefined}
        />
      </TooltipComponent>
    );
  };

  private filterIconName = (
    query: string,
    iconName: IconName | typeof NONE,
  ) => {
    if (iconName === NONE || query === "") {
      return true;
    }
    return iconName.toLowerCase().indexOf(query.toLowerCase()) >= 0;
  };

  private handleIconChange = (icon: IconType) =>
    this.updateProperty(
      this.props.propertyName,
      icon === NONE ? undefined : icon,
    );

  static getControlType() {
    return "ICON_SELECT";
  }
}

export default IconSelectControl;
