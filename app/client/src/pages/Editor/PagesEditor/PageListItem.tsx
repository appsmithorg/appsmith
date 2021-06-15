import { get } from "lodash";
import { useDispatch } from "react-redux";
import React, { useCallback, useState } from "react";
import styled, { useTheme } from "styled-components";

import {
  updatePage,
  clonePageInit,
  deletePage,
  setPageAsDefault,
} from "actions/pageActions";
import ContextMenu from "./ContextMenu";
import { FormIcons } from "icons/FormIcons";
import { ControlIcons } from "icons/ControlIcons";
import { resolveAsSpaceChar } from "utils/helpers";
import { Page } from "constants/ReduxActionConstants";
import EditName from "pages/Editor/Explorer/Entity/Name";

export const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

export const ListItem = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 10px;
  background-color: ${(props) => props.theme.colors.appBackground};
`;

export const EditNameContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  padding-left: 4px;

  & > .page-list-item-edit-icon {
    display: none;
    margin-left: 8px;
    align-items: center;
  }

  &:hover .page-list-item-edit-icon {
    display: flex;
  }

  & > div {
    display: flex;
    min-height: 36px;
    align-items: center;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
`;

export const Action = styled.button`
  cursor: pointer;
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: none;
  background: transparent;
  margin-left: 8px;

  &:hover,
  &:active,
  &.active {
    background: ${(props) => (props.disabled ? "initial" : "#e1e1e1")};
  }

  &:focus {
    outline: none;
  }
`;

const HomeIcon = FormIcons.HOME_ICON;
const DeleteIcon = FormIcons.DELETE_ICON;
const CopyIcon = ControlIcons.COPY_CONTROL;
const DragIcon = ControlIcons.DRAG_CONTROL;
const HideIcon = ControlIcons.HIDE_COLUMN;
const EditIcon = ControlIcons.EDIT_WHITE;

const DefaultPageIcon = styled(HomeIcon)`
  margin-right: 5px;
`;

export interface PageListItemProps {
  item: Page;
  applicationId: string;
}

function PageListItem(props: PageListItemProps) {
  const theme = useTheme();
  const { applicationId, item } = props;
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);

  const updateNameCallback = useCallback(
    (name: string) => {
      return dispatch(updatePage(item.pageId, name, !!item.isHidden));
    },
    [dispatch],
  );

  const clonePageCallback = useCallback(
    (pageId: string): void => {
      dispatch(clonePageInit(pageId, true));
    },
    [dispatch],
  );

  const deletePageCallback = useCallback(
    (pageId: string, pageName: string): void => {
      dispatch(deletePage(pageId, pageName));
    },
    [dispatch],
  );

  const setPageAsDefaultCallback = useCallback(
    (pageId: string, applicationId?: string): void => {
      dispatch(setPageAsDefault(pageId, applicationId));
    },
    [dispatch],
  );

  const setPageHidden = useCallback(() => {
    return dispatch(updatePage(item.pageId, item.pageName, !item.isHidden));
  }, [dispatch]);

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
  }, []);

  const enterEditMode = useCallback(() => setIsEditing(true), []);

  console.log({ isEditing });

  return (
    <Container>
      <ListItem>
        <DragIcon
          color={get(theme, "colors.propertyPane.iconColor")}
          cursor="move"
          height={20}
          width={20}
        />
        <EditNameContainer>
          <EditName
            enterEditMode={enterEditMode}
            entityId={item.pageId}
            exitEditMode={exitEditMode}
            isEditing={isEditing}
            name={item.pageName}
            nameTransformFn={resolveAsSpaceChar}
            updateEntityName={updateNameCallback}
          />
          {!isEditing && (
            <div className="page-list-item-edit-icon">
              <EditIcon
                color={get(theme, "colors.propertyPane.iconColor")}
                height={14}
                onClick={enterEditMode}
                width={14}
              />
            </div>
          )}
        </EditNameContainer>
        <Actions>
          {item.isDefault && (
            <Action disabled title="Default page">
              <DefaultPageIcon
                color={get(theme, "colors.primaryOld")}
                height={16}
                width={16}
              />
            </Action>
          )}
          {item.isHidden && (
            <Action disabled title="Hidden">
              <HideIcon
                color={get(theme, "colors.propertyPane.iconColor")}
                height={16}
                width={16}
              />
            </Action>
          )}
          <ContextMenu
            applicationId={applicationId}
            onCopy={clonePageCallback}
            onDelete={deletePageCallback}
            onSetPageDefault={setPageAsDefaultCallback}
            onSetPageHidden={setPageHidden}
            page={item}
          />
          <Action title="Clone" type="button">
            <CopyIcon
              color={get(theme, "colors.propertyPane.iconColor")}
              height={16}
              onClick={() => clonePageCallback(item.pageId)}
              width={16}
            />
          </Action>
          <Action title="Delete" type="button">
            <DeleteIcon
              color={
                item.isDefault
                  ? get(theme, "colors.propertyPane.deleteIconColor")
                  : get(theme, "colors.propertyPane.iconColor")
              }
              disabled={item.isDefault}
              height={16}
              onClick={() => deletePageCallback(item.pageId, item.pageName)}
              width={16}
            />
          </Action>
        </Actions>
      </ListItem>
    </Container>
  );
}
export default PageListItem;
