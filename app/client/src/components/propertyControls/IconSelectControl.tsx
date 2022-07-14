import * as React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Alignment, Button, Classes, MenuItem } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { ItemListRenderer, ItemRenderer, Select } from "@blueprintjs/select";
import {
  GridListProps,
  VirtuosoGrid,
  VirtuosoGridHandle,
} from "react-virtuoso";

import BaseControl, { ControlProps } from "./BaseControl";
import { TooltipComponent } from "design-system";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import _ from "lodash";
import { generateReactKey } from "utils/generators";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

const IconSelectContainerStyles = createGlobalStyle<{
  targetWidth: number | undefined;
  id: string;
}>`
  ${({ id, targetWidth }) => `
    .icon-select-popover-${id} {
      width: ${targetWidth}px;
      background: white;

      .bp3-input-group {
        margin: 5px !important;
      }
    }
  `}
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

const StyledMenu = styled.ul<GridListProps>`
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
  & li {
    list-style: none;
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
  activeIcon: IconType;
  isOpen: boolean;
}

const NONE = "(none)";
type IconType = IconName | typeof NONE;
const ICON_NAMES = Object.keys(IconNames).map<IconType>(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
ICON_NAMES.unshift(NONE);
const icons = new Set(ICON_NAMES);

const TypedSelect = Select.ofType<IconType>();

class IconSelectControl extends BaseControl<
  IconSelectControlProps,
  IconSelectControlState
> {
  private iconSelectTargetRef: React.RefObject<HTMLButtonElement>;
  private virtuosoRef: React.RefObject<VirtuosoGridHandle>;
  private initialItemIndex: number;
  private filteredItems: Array<IconType>;
  private searchInput: React.RefObject<HTMLInputElement>;
  id: string = generateReactKey();

  constructor(props: IconSelectControlProps) {
    super(props);
    this.iconSelectTargetRef = React.createRef();
    this.virtuosoRef = React.createRef();
    this.searchInput = React.createRef();
    this.initialItemIndex = 0;
    this.filteredItems = [];
    this.state = {
      activeIcon: props.propertyValue ?? NONE,
      isOpen: false,
    };
  }

  // debouncedSetState is used to fix the following bug:
  // https://github.com/appsmithorg/appsmith/pull/10460#issuecomment-1022895174
  private debouncedSetState = _.debounce(
    (obj: any, callback?: () => void) => {
      this.setState((prevState: IconSelectControlState) => {
        return {
          ...prevState,
          ...obj,
        };
      }, callback);
    },
    300,
    {
      leading: true,
      trailing: false,
    },
  );

  componentDidMount() {
    // keydown event is attached to body so that it will not interfere with the keydown handler in GlobalHotKeys
    document.body.addEventListener("keydown", this.handleKeydown);
  }

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.handleKeydown);
  }

  private handleQueryChange = _.debounce(() => {
    if (this.filteredItems.length === 2)
      this.setState({ activeIcon: this.filteredItems[1] });
  }, 50);

  public render() {
    const { defaultIconName, propertyValue: iconName } = this.props;
    const { activeIcon } = this.state;
    const containerWidth =
      this.iconSelectTargetRef.current?.getBoundingClientRect?.()?.width || 0;

    return (
      <>
        <IconSelectContainerStyles id={this.id} targetWidth={containerWidth} />
        <TypedSelect
          activeItem={activeIcon || defaultIconName || NONE}
          className="icon-select-container"
          inputProps={{
            inputRef: this.searchInput,
          }}
          itemListRenderer={this.renderMenu}
          itemPredicate={this.filterIconName}
          itemRenderer={this.renderIconItem}
          items={ICON_NAMES}
          onItemSelect={this.handleItemSelect}
          onQueryChange={this.handleQueryChange}
          popoverProps={{
            enforceFocus: false,
            minimal: true,
            isOpen: this.state.isOpen,
            popoverClassName: `icon-select-popover-${this.id}`,
            onInteraction: (state) => {
              if (this.state.isOpen !== state)
                this.debouncedSetState({ isOpen: state });
            },
          }}
        >
          <StyledButton
            alignText={Alignment.LEFT}
            className={
              Classes.TEXT_OVERFLOW_ELLIPSIS + " " + replayHighlightClass
            }
            elementRef={this.iconSelectTargetRef}
            fill
            icon={iconName || defaultIconName}
            onClick={this.handleButtonClick}
            rightIcon="caret-down"
            tabIndex={0}
            text={iconName || defaultIconName || NONE}
          />
        </TypedSelect>
      </>
    );
  }

  private setActiveIcon(iconIndex: number) {
    this.setState(
      {
        activeIcon: this.filteredItems[iconIndex],
      },
      () => {
        if (this.virtuosoRef.current) {
          this.virtuosoRef.current.scrollToIndex(iconIndex);
        }
      },
    );
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (this.state.isOpen) {
      switch (e.key) {
        case "Tab":
          e.preventDefault();
          this.setState({
            isOpen: false,
            activeIcon: this.props.propertyValue ?? NONE,
          });
          break;
        case "ArrowDown":
        case "Down": {
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          if (document.activeElement === this.searchInput.current) {
            (document.activeElement as HTMLElement).blur();
            if (this.initialItemIndex < 0) this.initialItemIndex = -4;
            else break;
          }
          const nextIndex = this.initialItemIndex + 4;
          if (nextIndex < this.filteredItems.length)
            this.setActiveIcon(nextIndex);
          e.preventDefault();
          break;
        }
        case "ArrowUp":
        case "Up": {
          if (document.activeElement === this.searchInput.current) {
            break;
          } else if (
            (e.shiftKey ||
              (this.initialItemIndex >= 0 && this.initialItemIndex < 4)) &&
            this.searchInput.current
          ) {
            emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
              key: e.key,
            });
            this.searchInput.current.focus();
            break;
          }
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          const nextIndex = this.initialItemIndex - 4;
          if (nextIndex >= 0) this.setActiveIcon(nextIndex);
          e.preventDefault();
          break;
        }
        case "ArrowRight":
        case "Right": {
          if (document.activeElement === this.searchInput.current) {
            break;
          }
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          const nextIndex = this.initialItemIndex + 1;
          if (nextIndex < this.filteredItems.length)
            this.setActiveIcon(nextIndex);
          e.preventDefault();
          break;
        }
        case "ArrowLeft":
        case "Left": {
          if (document.activeElement === this.searchInput.current) {
            break;
          }
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          const nextIndex = this.initialItemIndex - 1;
          if (nextIndex >= 0) this.setActiveIcon(nextIndex);
          e.preventDefault();
          break;
        }
        case " ":
        case "Enter": {
          if (
            this.searchInput.current === document.activeElement &&
            this.filteredItems.length !== 2
          )
            break;
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          this.handleIconChange(
            this.filteredItems[this.initialItemIndex],
            true,
          );
          this.debouncedSetState({ isOpen: false });
          e.preventDefault();
          e.stopPropagation();
          break;
        }
        case "Escape": {
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: e.key,
          });
          this.setState({
            isOpen: false,
            activeIcon: this.props.propertyValue ?? NONE,
          });
          e.stopPropagation();
        }
      }
    } else if (this.iconSelectTargetRef.current === document.activeElement) {
      switch (e.key) {
        case "ArrowUp":
        case "Up":
        case "ArrowDown":
        case "Down":
          this.debouncedSetState({ isOpen: true }, this.handleButtonClick);
          break;
        case "Tab":
          emitInteractionAnalyticsEvent(this.iconSelectTargetRef.current, {
            key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
          });
          break;
      }
    }
  };

  private handleButtonClick = () => {
    setTimeout(() => {
      if (this.virtuosoRef.current) {
        this.virtuosoRef.current.scrollToIndex(this.initialItemIndex);
      }
    }, 0);
  };

  private renderMenu: ItemListRenderer<IconType> = ({
    activeItem,
    filteredItems,
    renderItem,
  }) => {
    this.filteredItems = filteredItems;
    this.initialItemIndex = filteredItems.findIndex((x) => x === activeItem);

    return (
      <VirtuosoGrid
        components={{
          List: StyledMenu,
        }}
        computeItemKey={(index) => filteredItems[index]}
        initialItemCount={16}
        itemContent={(index) => renderItem(filteredItems[index], index)}
        ref={this.virtuosoRef}
        style={{ height: "165px" }}
        tabIndex={-1}
        totalCount={filteredItems.length}
      />
    );
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
          textClassName={icon === NONE ? "bp3-icon-(none)" : ""}
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

  private handleIconChange = (icon: IconType, isUpdatedViaKeyboard = false) => {
    this.setState({ activeIcon: icon });
    this.updateProperty(
      this.props.propertyName,
      icon === NONE ? undefined : icon,
      isUpdatedViaKeyboard,
    );
  };

  private handleItemSelect = (icon: IconType) => {
    this.handleIconChange(icon, false);
  };

  static getControlType() {
    return "ICON_SELECT";
  }

  static canDisplayValueInUI(
    config: IconSelectControlProps,
    value: any,
  ): boolean {
    if (icons.has(value)) return true;
    return false;
  }
}

export default IconSelectControl;
