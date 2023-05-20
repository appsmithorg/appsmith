import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Table } from "design-system-old";
import { Loader } from "./components";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";
import type { ListingProps, MenuItemProps } from "./types";
import { ListingType } from "./types";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";

const ListingWrapper = styled.div`
  height: calc(100vh - 148px);
  overflow: auto;
  table {
    border-collapse: separate;
    table-layout: fixed;
    height: 100%;
    thead {
      background: var(--ads-v2-color-bg);
      z-index: 1;
      tr {
        background: none;
        th {
          color: var(--ads-v2-color-fg);
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: -0.24px;
          cursor: initial;
          padding: 32px 20px 8px;

          &:last-child {
            width: 10%;
          }

          &:hover {
            color: var(--ads-v2-color-fg);
            cursor: initial;
          }
        }
      }
    }
    tbody {
      tr {
        td {
          color: var(--ads-v2-color-fg);
          line-height: 16px;
          vertical-align: middle;
          border-bottom: 1px solid var(--ads-v2-color-border);
          word-break: break-all;
          height: 100%;

          a:hover {
            color: inherit;
            text-decoration: none;
          }

          &:last-child {
            text-align: right;
            vertical-align: baseline;
          }

          .actions-icon {
            visibility: hidden;
            &.active {
              visibility: visible;
            }
          }

          .user-email-link {
            display: block;
            height: 100%;
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
  const {
    columns,
    data = [],
    emptyState,
    isLoading,
    keyAccessor,
    listMenuItems,
    listingType = "",
  } = props;

  const updatedColumns = [
    ...columns,
    {
      Header: "",
      accessor: "actions",
      disableSortBy: true,
      Cell: function ActionCell(props: any) {
        const [showOptions, setShowOptions] = useState(false);
        const [showConfirmationText, setShowConfirmationText] = useState(false);
        const userPermissions = props.cell.row.original.userPermissions ?? [];
        const canEdit = isPermitted(
          userPermissions,
          PERMISSION_TYPE[
            `MANAGE_${listingType.toLocaleUpperCase()}` as keyof typeof PERMISSION_TYPE
          ],
        );
        const canDelete = isPermitted(
          userPermissions,
          PERMISSION_TYPE[
            `DELETE_${listingType.toLocaleUpperCase()}` as keyof typeof PERMISSION_TYPE
          ],
        );

        const filteredMenuItems = useMemo(
          () =>
            [`${ListingType.USERS}`].indexOf(listingType) !== -1
              ? listMenuItems
              : listMenuItems?.filter((menuItem) => {
                  if (menuItem.label === "edit" && !canEdit) return false;
                  if (menuItem.label === "delete" && !canDelete) return false;
                  /* when we have clone option, we can add it here likewise*/
                  return true;
                }),
          [listMenuItems],
        );

        const onOptionSelect = (
          e: React.MouseEvent<Element, MouseEvent>,
          menuItem: MenuItemProps,
        ) => {
          if (menuItem.label === "delete") {
            setTimeout(() => {
              setShowOptions(true);
              setShowConfirmationText(true);
              showConfirmationText &&
                menuItem?.onSelect?.(
                  e,
                  props?.cell?.row?.original[keyAccessor],
                );
            }, 0);
          } else {
            setShowOptions(false);
            setShowConfirmationText(false);
            menuItem?.onSelect?.(e, props?.cell?.row?.original[keyAccessor]);
          }
        };

        return (
          filteredMenuItems &&
          filteredMenuItems.length > 0 && (
            <Menu
              onOpenChange={(open: boolean) => {
                if (showOptions) {
                  setShowOptions(open);
                  showConfirmationText && setShowConfirmationText(false);
                }
              }}
              open={showOptions}
            >
              <MenuTrigger>
                <Button
                  className={`actions-icon ${showOptions && "active"}`}
                  data-testid="actions-cell-menu-icon"
                  isIconButton
                  kind="tertiary"
                  onClick={() => setShowOptions(!showOptions)}
                  size="sm"
                  startIcon="more-2-fill"
                />
              </MenuTrigger>
              <MenuContent align="end">
                {filteredMenuItems.map((menuItem) => (
                  <MenuItem
                    className={`${menuItem.className} ${
                      menuItem.label === "delete" ? "error-menuitem" : ""
                    }`}
                    data-testid={`t--${menuItem.className}`}
                    key={menuItem.text}
                    onClick={(e: React.MouseEvent) => {
                      onOptionSelect(e, menuItem);
                    }}
                    startIcon={menuItem.icon}
                  >
                    {showConfirmationText && menuItem.label === "delete"
                      ? createMessage(ARE_YOU_SURE)
                      : menuItem.text}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          )
        );
      },
    },
  ].filter(Boolean);

  return (
    <ListingWrapper data-testid="listing-wrapper">
      <Table
        columns={updatedColumns}
        data={data}
        data-testid="listing-table"
        isLoading={isLoading}
        loaderComponent={<Loader />}
        noDataComponent={emptyState}
      />
    </ListingWrapper>
  );
}
