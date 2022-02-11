import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { find, findIndex } from "lodash";
import {
  PopoverInteractionKind,
  PopoverPosition,
  IPopoverSharedProps,
  MenuItem,
  Popover,
  Menu,
  Button,
  Classes,
  Position,
} from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { DropdownOption } from "components/constants";
import Icon, { IconSize } from "components/ads/Icon";
import { replayHighlightClass } from "globalStyles/portals";

export type TreeDropdownOption = DropdownOption & {
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
  icon?: React.ReactNode;
  isChildrenOpen?: boolean;
  selfIndex?: number[];
  args?: Array<any>;
};

type Setter = (value: TreeDropdownOption, defaultVal?: string) => void;

export type TreeDropdownProps = {
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
  position?: Position;
};

const StyledMenu = styled(Menu)`
  max-height: ${(props) =>
    `calc(100vh - ${props.theme.smallHeaderHeight} - ${props.theme.bottomBarHeight})`};
  overflow: auto;
  min-width: 220px;
  padding: 0px;
  border-radius: 0px;
  background-color: ${(props) => props.theme.colors.treeDropdown.menuBg.normal};
  .${Classes.MENU} {
    min-width: 220px;
    padding: 0px;
    border-radius: 0px;
    background-color: ${(props) =>
      props.theme.colors.treeDropdown.menuBg.normal};
    max-height: 90vh;
    overflow-y: scroll;
  }
  .${Classes.MENU_ITEM} {
    border-radius: 0px;
    font-size: 14px;
    line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
    display: flex;
    align-items: center;
    height: 30px;
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
    .${Classes.ICON} > svg:not([fill]) {
      margin-top: 0px;
      fill: #9f9f9f;
    }

    &.t--apiFormDeleteBtn {
      color: ${Colors.DANGER_SOLID};
      .${Classes.ICON} svg {
        fill: ${Colors.DANGER_SOLID};
      }
    }

    &.t--apiFormDeleteBtn:hover {
      background-color: ${Colors.GREY_3};
      color: ${Colors.DANGER_SOLID};
      .${Classes.ICON} svg {
        fill: ${Colors.DANGER_SOLID};
      }
    }

    &:hover:not(.t--apiFormDeleteBtn) {
      background-color: ${Colors.GREY_3};
      color: ${Colors.GREY_10};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${Colors.GREY_10};
      }
    }

    &.${Classes.ACTIVE} {
      background-color: ${Colors.GREY_3};
      color: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      }
    }
  }
  .${Classes.MENU_SUBMENU}
    .${Classes.POPOVER_TARGET}.${Classes.POPOVER_OPEN}
    > .${Classes.MENU_ITEM} {
    background-color: ${Colors.GREY_3};
  }
`;

const DropdownTarget = styled.div`
  &&&& .${Classes.BUTTON} {
    width: 100%;
    box-shadow: none;
    border-radius: 0px;
    border: 1px solid ${Colors.GREY_5};
    min-height: 36px;
    background-color: ${(props) => props.theme.colors.treeDropdown.targetBg};
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
    background-image: none;
    display: flex;
    justify-content: space-between;
    padding: 5px 12px;

    &:active,
    &:focus {
      border-color: var(--appsmith-input-focus-border-color);
    }
  }
  &&&& .${Classes.ICON} {
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
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

function TreeDropdown(props: TreeDropdownProps) {
  const {
    defaultText,
    displayValue,
    getDefaults,
    onSelect,
    selectedLabelModifier,
    selectedValue,
    toggle,
  } = props;
  const [optionTree, setOptionTree] = useState<TreeDropdownOption[]>(
    setSelfIndex(props.optionTree),
  );
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
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
  }, [isOpen]);

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      option.onSelect(option, onSelect);
    } else {
      const defaultVal = getDefaults ? getDefaults(option.value) : undefined;
      onSelect(option, defaultVal);
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
    return (e: any) => {
      handleSelect(option);
      setIsOpen(false);
      props.onMenuToggle && props.onMenuToggle(false);
      e?.stopPropagation && e.stopPropagation();
    };
  };

  function RenderTreeOption(option: TreeDropdownOption) {
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
        {option.children && option.children.map(RenderTreeOption)}
      </MenuItem>
    );
  }

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
          const selectedOpt = getItem(optionTree, selectedOptionIndex.current);
          if (selectedOpt?.children) {
            handleOptionClick(selectedOpt)(e);
          } else if (selectedOpt && e.key !== "ArrowRight") {
            handleOptionClick(selectedOpt)(e);
            shouldOpen.current = false;
          }
        } else if (e.key !== "ArrowRight") {
          setIsOpen(true);
          selectedOptionIndex.current = [findIndex(optionTree, selectedOption)];
          shouldOpen.current = true;
        }
        break;
      case "ArrowUp":
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
        if (isOpen) {
          setIsOpen(false);
          // reset selected option
          setSelectedOption(
            getSelectedOption(selectedValue, defaultText, optionTree),
          );
        }
        break;
      case "ArrowLeft":
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

  const list = optionTree.map(RenderTreeOption);
  const menuItems = <StyledMenu>{list}</StyledMenu>;
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
        rightIcon={<Icon name="downArrow" size={IconSize.XXL} />}
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
    >
      {toggle ? toggle : defaultToggle}
    </Popover>
  );
}

export default memo(TreeDropdown);
