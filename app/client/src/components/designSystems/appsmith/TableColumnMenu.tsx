import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Icon,
  Position,
} from "@blueprintjs/core";
import {
  DropDownWrapper,
  OptionWrapper,
  IconOptionWrapper,
} from "./TableStyledWrappers";
import {
  ColumnMenuSubOptionProps,
  ColumnMenuOptionProps,
} from "./ReactTableComponent";

interface TableColumnMenuPopup {
  showMenu: (index: number) => void;
  columnIndex: number;
  columnMenuOptions: ColumnMenuOptionProps[];
}

export const TableColumnMenuPopup = (props: TableColumnMenuPopup) => {
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
    >
      <Icon
        icon="more"
        iconSize={12}
        color="#A1ACB3"
        onClick={e => {
          props.showMenu(props.columnIndex);
        }}
      />
      <DropDownWrapper>
        {props.columnMenuOptions.map(
          (option: ColumnMenuOptionProps, index: number) => (
            <OptionWrapper
              key={index}
              onClick={() => {
                if (option.onClick) {
                  option.onClick(!!option.isSelected);
                }
              }}
              className={
                option.closeOnClick
                  ? Classes.POPOVER_DISMISS
                  : option.category
                  ? "non-selectable"
                  : ""
              }
              selected={!!option.isSelected}
            >
              {!option.options && <div>{option.content}</div>}
              {option.options && (
                <Popover
                  minimal
                  usePortal
                  enforceFocus={false}
                  interactionKind={PopoverInteractionKind.CLICK}
                  position={Position.BOTTOM_RIGHT}
                  className="column-type"
                >
                  <IconOptionWrapper>{option.content}</IconOptionWrapper>
                  <DropDownWrapper>
                    {option.options.map(
                      (item: ColumnMenuSubOptionProps, itemIndex: number) => (
                        <OptionWrapper
                          key={itemIndex}
                          onClick={item.onClick}
                          className={
                            item.closeOnClick ? Classes.POPOVER_DISMISS : ""
                          }
                          selected={!!item.isSelected}
                        >
                          {item.content}
                        </OptionWrapper>
                      ),
                    )}
                  </DropDownWrapper>
                </Popover>
              )}
            </OptionWrapper>
          ),
        )}
      </DropDownWrapper>
    </Popover>
  );
};
