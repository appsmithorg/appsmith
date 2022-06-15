import React, { useState } from "react";
import styled from "styled-components";
import { IconSize, MenuItemProps, Table } from "components/ads";
import { Icon, Menu, MenuItem } from "components/ads";
import EmptyDataState from "components/utils/EmptyDataState";
import { Position } from "@blueprintjs/core";
import { HelpPopoverStyle } from "./components";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";

type ListingProps = {
  data: any[];
  columns: any[];
  listMenuItems: MenuItemProps[];
  keyAccessor: string;
};

const ListingWrapper = styled.div`
  table {
    table-layout: fixed;
    thead {
      tr {
        background: none;
        th {
          color: var(--appsmith-color-black-700);
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: -0.24px;
          cursor: initial;
          border-bottom: 1px solid var(--appsmith-color-black-200);
          padding: 40px 20px 8px;

          &:hover {
            color: var(--appsmith-color-black-700);
            cursor: initial;
          }
        }
      }
    }
    tbody {
      tr {
        td {
          color: var(--appsmith-color-black-800);
          line-height: 16px;
          vertical-align: baseline;
          border-bottom: 1px solid var(--appsmith-color-black-200);
          word-break: break-all;

          &:first-child {
            color: var(--appsmith-color-black-800);
          }

          span.bp3-popover-target > * {
            justify-content: end;
          }

          a:hover {
            color: inherit;
            text-decoration: none;
          }

          .actions-icon {
            visibility: hidden;
            > svg {
              path {
                fill: var(--appsmith-color-black-400);
              }

              &:hover {
                path {
                  fill: var(--appsmith-color-black-700);
                }
              }
            }
            &.active {
              visibility: visible;
            }
          }
        }

        &:hover {
          td {
            .actions-icon {
              visibility: visible;
            }
          }
        }
      }
    }
  }
`;

export function Listing(props: ListingProps) {
  const { columns, data, keyAccessor, listMenuItems } = props;

  const updatedColumns = [
    ...columns,
    {
      Header: "",
      accessor: "actions",
      disableSortBy: true,
      Cell: function ActionCell(props: any) {
        const [showOptions, setShowOptions] = useState(false);
        const [showConfirmationText, setShowConfirmationText] = useState(false);

        const onOptionSelect = (
          e: React.MouseEvent<Element, MouseEvent>,
          menuItem: MenuItemProps,
        ) => {
          if (menuItem.label === "delete") {
            if (showConfirmationText) {
              menuItem?.onSelect?.(e, props?.cell?.row?.original[keyAccessor]);
            } else {
              setShowOptions(true);
              setShowConfirmationText(true);
            }
          } else {
            setShowConfirmationText(false);
            menuItem?.onSelect?.(e, props?.cell?.row?.original[keyAccessor]);
          }
        };

        return (
          <Menu
            canEscapeKeyClose
            canOutsideClickClose
            className="t--menu-actions-icon"
            data-testid="actions-cell-menu-options"
            isOpen={showOptions}
            menuItemWrapperWidth={"auto"}
            onClose={() => setShowOptions(false)}
            onClosing={() => {
              setShowConfirmationText(false);
              setShowOptions(false);
            }}
            onOpening={() => setShowOptions(true)}
            position={Position.BOTTOM_RIGHT}
            target={
              <Icon
                className={`actions-icon ${showOptions && "active"}`}
                data-testid="actions-cell-menu-icon"
                name="more-2-fill"
                onClick={() => setShowOptions(!showOptions)}
                size={IconSize.XXL}
              />
            }
          >
            <HelpPopoverStyle />
            {listMenuItems &&
              listMenuItems.map((menuItem) => (
                <MenuItem
                  className={menuItem.className}
                  icon={menuItem.icon}
                  key={menuItem.text}
                  onSelect={(e) => {
                    onOptionSelect(e, menuItem);
                  }}
                  text={
                    showConfirmationText && menuItem.label === "delete"
                      ? createMessage(ARE_YOU_SURE)
                      : menuItem.text
                  }
                  {...(showConfirmationText && menuItem.label === "delete"
                    ? { type: "warning" }
                    : {})}
                />
              ))}
          </Menu>
        );
      },
    },
  ];

  return (
    <ListingWrapper data-testid="listing-wrapper">
      {data?.length > 0 ? (
        <Table
          columns={updatedColumns}
          data={data}
          data-testid="listing-table"
        />
      ) : (
        <EmptyDataState />
      )}
    </ListingWrapper>
  );
}
