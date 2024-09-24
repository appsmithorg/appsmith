import type { PropsWithChildren } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { find, findIndex } from "lodash";
import type { IPopoverSharedProps } from "@blueprintjs/core";
import {
  PopoverInteractionKind,
  PopoverPosition,
  MenuItem,
  Popover,
  Menu,
  Button,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";
import { replayHighlightClass } from "../constants/classes";
import useDSEvent from "../hooks/useDSEvent";
import { DSEventTypes } from "../types/common";
import { typography } from "../constants/typography";
import type { Intent as BlueprintIntent } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import "./styles.module.css";

export interface TreeDropdownOption {
  label: string;
  value: string;
  subText?: string;
  id?: string;
  intent?: BlueprintIntent;
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
  icon?: IconName;
  isChildrenOpen?: boolean;
  selfIndex?: number[];
  args?: Array<any>;
}

export type Setter = (
  value: TreeDropdownOption,
  defaultVal?: string,
  isUpdatedViaKeyboard?: boolean,
) => void;

export interface TreeDropdownProps {
  optionTree: TreeDropdownOption[];
  selectedValue: string;
  getDefaults?: (value: any) => any;
  defaultText: string;
  onSelect: Setter;
  selectedLabelModifier?: (
    option: TreeDropdownOption,
    displayValue?: string,
  ) => React.ReactNode;
  displayValue?: string;
  toggle?: React.ReactNode;
  className?: string;
  modifiers?: IPopoverSharedProps["modifiers"];
  onMenuToggle?: (isOpen: boolean) => void;
  position?: PopoverPosition;
  menuWidth?: number;
  menuHeight?: number;
  popoverClassName?: string;
  usePortal?: boolean;
  defaultOpen?: boolean;
}

export type StyledMenuProps = PropsWithChildren<{
  width?: number;
  height?: number;
}>;

export const StyledMenu = styled(Menu)<StyledMenuProps>`
  max-height: ${(props: StyledMenuProps) =>
    props.height
      ? `${props.height}px`
      : `calc(
    100vh - var(--ads-small-header-height) - var(--ads-bottom-bar-height)
  )`};
  overflow: auto;
  min-width: 220px;
  width: ${(props) => `${props.width}px`};
  padding: var(--ads-v2-spaces-2);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border-muted);
  box-shadow: var(--ads-v2-shadow-popovers);
  .${Classes.MENU} {
    min-width: 220px;
    width: ${(props) => `${props.width}px`};
    padding: 0px;
    border-radius: var(--ads-v2-border-radius);
    background-color: var(--ads-v2-color-bg);
    max-height: 90vh;
    overflow-y: scroll;
  }
  .${Classes.MENU_ITEM} {
    border-radius: var(--ads-v2-border-radius);
    font-size: 14px;
    line-height: ${typography.p1.lineHeight}px;
    display: flex;
    padding: var(--ads-v2-spaces-2);
    align-items: center;
    height: 36px;
    color: var(--ads-v2-color-fg);
    .${Classes.ICON} > svg:not([fill]) {
      margin-top: 0px;
      fill: var(--ads-v2-color-fg);
    }

    &.t--apiFormDeleteBtn {
      color: var(--ads-v2-color-fg-error);
      .${Classes.ICON} svg {
        fill: var(--ads-v2-color-fg-error);
      }
    }

    &.t--apiFormDeleteBtn:hover {
      background-color: var(--ads-v2-color-bg-subtle);
      color: var(--ads-v2-color-fg-error);
      .${Classes.ICON} svg {
        fill: var(--ads-v2-color-fg-error);
      }
    }

    &:hover:not(.t--apiFormDeleteBtn) {
      background-color: var(--ads-v2-color-bg-subtle);
      color: var(--ads-v2-color-fg);
      .${Classes.ICON} > svg:not([fill]) {
        fill: var(--ads-v2-color-fg);
      }

      &.${Classes.ACTIVE} {
        background-color: var(--ads-v2-color-bg-muted);
      }
    }

    &.${Classes.ACTIVE} {
      background-color: var(--ads-v2-color-bg-muted);
      color: var(--ads-v2-color-fg) !important;
      .${Classes.ICON} > svg:not([fill]) {
        fill: var(--ads-v2-color-fg);
      }
    }
  }
  .${Classes.MENU_SUBMENU}
    .${Classes.POPOVER_TARGET}.${Classes.POPOVER_OPEN}
    > .${Classes.MENU_ITEM} {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const DropdownTarget = styled.div`
  &&&& .${Classes.BUTTON} {
    width: 100%;
    box-shadow: none;
    border-radius: var(--ads-v2-border-radius);
    border: 1px solid var(--ads-v2-color-border);
    min-height: 36px;
    background-color: var(--ads-v2-color-bg);
    color: var(--ads-v2-color-fg);
    background-image: none;
    display: flex;
    justify-content: space-between;
    padding: 5px 12px;

    &:hover {
      border-color: var(--ads-v2-color-border-emphasis);
    }

    &:active,
    &:focus {
      border-color: var(--ads-v2-color-border-emphasis-plus);
    }
  }
  &&&& .${Classes.ICON} {
    color: var(--ads-v2-color-fg);
  }
`;

export function calculateNext(arr: number[], max: number) {
  return [
    ...arr.slice(0, arr.length - 1),
    (arr[arr.length - 1] + 1) % (max + 1),
  ];
}

export function calculatePrev(arr: number[], max: number) {
  let lastNum = arr[arr.length - 1];

  if (lastNum <= 0) lastNum = max;
  else lastNum--;

  return [...arr.slice(0, arr.length - 1), lastNum];
}

export function getItem(
  arr: TreeDropdownOption[],
  index: number[],
): TreeDropdownOption | undefined {
  if (index.length === 0) return undefined;

  const firstIndex = index[0] ?? 0;

  if (index.length === 1) return arr[firstIndex];

  return getItem(arr[firstIndex]?.children ?? [], index.slice(1));
}

export function setItem(
  arr: TreeDropdownOption[],
  index: number[],
  item: TreeDropdownOption,
): TreeDropdownOption[] | undefined {
  if (index.length === 0) return undefined;

  const firstIndex = index[0] ?? 0;

  let subItem = { ...arr[firstIndex] };

  if (subItem.children && index.length > 1)
    subItem.children = setItem(subItem.children, index.slice(1), item);
  else subItem = item;

  return [...arr.slice(0, firstIndex), subItem, ...arr.slice(firstIndex + 1)];
}

export function closeAllChildren(tree: TreeDropdownOption[]) {
  return tree.map((x) => {
    let data = x;

    if (x.isChildrenOpen)
      data = {
        ...x,
        isChildrenOpen: false,
      };

    if (x.children) data["children"] = closeAllChildren(x.children);

    return data;
  });
}

export function deepOpenChildren(tree: TreeDropdownOption[], index: number[]) {
  return tree.map((x, i) => {
    if (i !== index[0]) return x;

    const data = x;

    data["isChildrenOpen"] = true;

    if (x?.children)
      data["children"] = deepOpenChildren(data?.children ?? [], index.slice(1));

    return x;
  });
}

export function setSelfIndex(
  tree: TreeDropdownOption[],
  prevIndex = [],
): TreeDropdownOption[] {
  return tree.map((x, i) => {
    const ob: any = { ...x };

    ob.selfIndex = [...prevIndex, i];

    if (ob.children) ob.children = setSelfIndex(ob.children, ob.selfIndex);

    return ob;
  });
}

function getSelectedOption(
  selectedValue: string,
  defaultText: string,
  options: TreeDropdownOption[],
) {
  let selectedOption: TreeDropdownOption = {
    label: defaultText,
    value: "",
  };

  options.length > 0 &&
    options.forEach((option) => {
      // Find the selected option in the OptionsTree
      if (option.value === selectedValue) {
        selectedOption = option;
      } else {
        const childOption = find(option.children, {
          value: selectedValue,
        });

        if (childOption) {
          selectedOption = childOption;
        }
      }
    });

  return selectedOption;
}

interface RenderTreeOptionProps {
  option: TreeDropdownOption;
  optionTree: TreeDropdownOption[];
  selectedOption: TreeDropdownOption;
  handleSelect: (
    option: TreeDropdownOption,
    isUpdatedViaKeyboard: boolean,
  ) => any;
  handleOptionClick: (
    option: TreeDropdownOption,
  ) => (e: any, isUpdatedViaKeyboard?: boolean) => void;
}

function RenderTreeOption({
  handleOptionClick,
  handleSelect,
  option,
  optionTree,
  selectedOption,
}: RenderTreeOptionProps) {
  const isSelected =
    selectedOption.value === option.value ||
    selectedOption.type === option.value;

  const popoverProps = useMemo(
    () => ({
      minimal: true,
      isOpen: option.isChildrenOpen,
      interactionKind: PopoverInteractionKind.CLICK,
      position: PopoverPosition.RIGHT_TOP,
      targetProps: { onClick: (e: any) => e.stopPropagation() },
    }),
    [option.isChildrenOpen],
  );

  const optionClickHandler = useCallback(handleOptionClick(option), [
    optionTree,
    handleSelect,
  ]);

  return (
    <MenuItem
      active={isSelected}
      className={option.className || "single-select"}
      icon={option.icon}
      intent={option.intent}
      key={option.value}
      onClick={optionClickHandler}
      popoverProps={popoverProps}
      text={option.label}
    >
      {option.children &&
        option.children.map((o) => (
          <RenderTreeOption
            handleOptionClick={handleOptionClick}
            handleSelect={handleSelect}
            key={`${o.value}-${o.label}`}
            option={o}
            optionTree={optionTree}
            selectedOption={selectedOption}
          />
        ))}
    </MenuItem>
  );
}

function TreeDropdown(props: TreeDropdownProps) {
  const {
    defaultOpen = false,
    defaultText,
    displayValue,
    getDefaults,
    menuHeight,
    menuWidth,
    onSelect,
    popoverClassName = "",
    selectedLabelModifier,
    selectedValue,
    toggle,
    usePortal = true,
  } = props;
  const [optionTree, setOptionTree] = useState<TreeDropdownOption[]>(
    setSelfIndex(props.optionTree),
  );
  const isFirstRender = useRef(true);
  const selectedOptionFromProps = getSelectedOption(
    selectedValue,
    defaultText,
    optionTree,
  );
  const [selectedOption, setSelectedOption] = useState<TreeDropdownOption>(
    getSelectedOption(selectedValue, defaultText, optionTree),
  );
  const selectedOptionIndex = useRef([findIndex(optionTree, selectedOption)]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const { emitDSEvent } = useDSEvent<HTMLButtonElement>(false, buttonRef);

  const emitKeyPressEvent = useCallback(
    (key: string) => {
      emitDSEvent({
        component: "TreeDropdown",
        event: DSEventTypes.KEYPRESS,
        meta: {
          key,
        },
      });
    },
    [emitDSEvent],
  );

  useEffect(() => {
    if (!isOpen) {
      setOptionTree(closeAllChildren);
      // reset selected option
      const defaultSelectedOption = getSelectedOption(
        selectedValue,
        defaultText,
        optionTree,
      );

      setSelectedOption((prev) => {
        if (prev.value === defaultSelectedOption.value) return prev;

        return defaultSelectedOption;
      });
    }
  }, [isOpen, selectedValue]);

  useEffect(() => {
    // Skip setting the option tree on first render, minor optimization
    if (!isFirstRender.current) {
      setOptionTree(setSelfIndex(props.optionTree));
    } else {
      isFirstRender.current = false;
    }
  }, [props.optionTree]);

  const handleSelect = (
    option: TreeDropdownOption,
    isUpdatedViaKeyboard: boolean,
  ) => {
    if (option.onSelect) {
      option.onSelect(option, onSelect);
    } else {
      const defaultVal = getDefaults ? getDefaults(option.value) : undefined;

      onSelect(option, defaultVal, isUpdatedViaKeyboard);
    }

    setSelectedOption(option);
  };

  const handleOptionClick = (option: TreeDropdownOption) => {
    if (option.children)
      return (e: any) => {
        const itemIndex = option.selfIndex || [];

        if (option?.children) {
          setOptionTree((prev) => {
            if (option.isChildrenOpen)
              return (
                setItem(
                  deepOpenChildren(closeAllChildren(prev), itemIndex),
                  itemIndex,
                  {
                    ...option,
                    isChildrenOpen: false,
                  },
                ) ?? prev
              );

            return deepOpenChildren(closeAllChildren(prev), itemIndex);
          });
          buttonRef.current?.focus();
          setSelectedOption(option.children[0]);

          if (option?.children[0]?.selfIndex)
            selectedOptionIndex.current = option.children[0].selfIndex;
        }

        e?.stopPropagation && e.stopPropagation();
      };

    return (e: any, isUpdatedViaKeyboard = false) => {
      handleSelect(option, isUpdatedViaKeyboard);
      setIsOpen(false);
      props.onMenuToggle && props.onMenuToggle(false);
      e?.stopPropagation && e.stopPropagation();
    };
  };

  /**
   * shouldOpen flag is used to differentiate between a Keyboard
   * induced (Enter or space key) 'click' event vs a mouse 'click' event
   * for the button
   */
  const shouldOpen = useRef(true);

  const handleKeydown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        if (isOpen) {
          emitKeyPressEvent(e.key);

          if (selectedOptionIndex.current.length > 1) {
            setOptionTree((prev) => {
              const prevIndex = selectedOptionIndex.current.slice(0, -1);
              const prevItem = getItem(prev, prevIndex);

              if (prevItem) {
                selectedOptionIndex.current = prevIndex;
                setSelectedOption(prevItem);

                return (
                  setItem(prev, prevIndex, {
                    ...prevItem,
                    isChildrenOpen: false,
                  }) ?? prev
                );
              }

              return prev;
            });
          } else {
            setIsOpen(false);
          }

          e.nativeEvent.stopImmediatePropagation();
        }

        break;
      case " ":
      case "Enter":
      case "ArrowRight":
        if (isOpen) {
          emitKeyPressEvent(e.key);
          const selectedOpt = getItem(optionTree, selectedOptionIndex.current);

          if (selectedOpt?.children) {
            handleOptionClick(selectedOpt)(e, true);
          } else if (selectedOpt && e.key !== "ArrowRight") {
            handleOptionClick(selectedOpt)(e, true);
            shouldOpen.current = false;
          }
        } else if (e.key !== "ArrowRight") {
          emitKeyPressEvent(e.key);
          setIsOpen(true);
          selectedOptionIndex.current = [findIndex(optionTree, selectedOption)];
          shouldOpen.current = true;
        }

        break;
      case "ArrowUp":
        emitKeyPressEvent(e.key);
        e.preventDefault();

        if (isOpen) {
          let currentLength = optionTree.length;

          if (selectedOptionIndex.current.length > 1) {
            currentLength =
              getItem(optionTree, selectedOptionIndex.current.slice(0, -1))
                ?.children?.length ?? 0;
          }

          selectedOptionIndex.current = calculatePrev(
            selectedOptionIndex.current,
            currentLength - 1,
          );
          const nextItem =
            getItem(optionTree, selectedOptionIndex.current) ??
            getSelectedOption(selectedValue, defaultText, optionTree);

          setSelectedOption(nextItem);
        } else {
          setIsOpen(true);
        }

        break;
      case "ArrowDown":
        emitKeyPressEvent(e.key);
        e.preventDefault();

        if (isOpen) {
          let currentLength = optionTree.length;

          if (selectedOptionIndex.current.length > 1) {
            currentLength =
              getItem(optionTree, selectedOptionIndex.current.slice(0, -1))
                ?.children?.length ?? 0;
          }

          selectedOptionIndex.current = calculateNext(
            selectedOptionIndex.current,
            currentLength - 1,
          );
          const nextItem =
            getItem(optionTree, selectedOptionIndex.current) ??
            getSelectedOption(selectedValue, defaultText, optionTree);

          setSelectedOption(nextItem);
        } else {
          setIsOpen(true);
        }

        break;
      case "Tab":
        emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);

        if (isOpen) {
          setIsOpen(false);
          // reset selected option
          setSelectedOption(
            getSelectedOption(selectedValue, defaultText, optionTree),
          );
        }

        break;
      case "ArrowLeft":
        emitKeyPressEvent(e.key);

        if (selectedOptionIndex.current.length > 1) {
          setOptionTree((prev) => {
            const prevIndex = selectedOptionIndex.current.slice(0, -1);
            const prevItem = getItem(prev, prevIndex);

            if (prevItem) {
              selectedOptionIndex.current = prevIndex;
              setSelectedOption(prevItem);

              return (
                setItem(prev, prevIndex, {
                  ...prevItem,
                  isChildrenOpen: false,
                }) ?? prev
              );
            }

            return prev;
          });
        }

        break;
    }
  };

  const list = optionTree.map((o) => (
    <RenderTreeOption
      handleOptionClick={handleOptionClick}
      handleSelect={handleSelect}
      key={`${o.value}-${o.label}`}
      option={o}
      optionTree={optionTree}
      selectedOption={selectedOption}
    />
  ));

  const menuItems = (
    <StyledMenu height={menuHeight} width={menuWidth || 220}>
      {list}
    </StyledMenu>
  );
  const defaultToggle = (
    <DropdownTarget>
      <Button
        className={`t--open-dropdown-${defaultText.split(" ").join("-")} ${
          selectedLabelModifier
            ? "code-highlight " + replayHighlightClass
            : replayHighlightClass
        }`}
        elementRef={buttonRef}
        onKeyDown={handleKeydown}
        rightIcon={<Icon name="down-arrow" size="md" />}
        text={
          selectedLabelModifier
            ? selectedLabelModifier(selectedOptionFromProps, displayValue)
            : selectedOptionFromProps.label
        }
      />
    </DropdownTarget>
  );

  return (
    <Popover
      className="wrapper-popover"
      content={menuItems}
      isOpen={isOpen}
      minimal
      modifiers={props.modifiers}
      onClose={() => {
        setIsOpen(false);
        props.onMenuToggle && props.onMenuToggle(false);
      }}
      popoverClassName={popoverClassName + " ads--dropdown-popover"}
      position={props.position || PopoverPosition.LEFT}
      targetProps={{
        onClick: (e: any) => {
          // e.detail will be 1 if the event is a mouse click
          if (e.detail === 1) shouldOpen.current = true;

          if (shouldOpen.current) setIsOpen(true);

          props.onMenuToggle && props.onMenuToggle(true);
          e.stopPropagation();
        },
      }}
      usePortal={usePortal}
    >
      {toggle ? toggle : defaultToggle}
    </Popover>
  );
}

export default TreeDropdown;
