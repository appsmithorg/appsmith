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
  & > div {
    display: flex;
    min-height: 36px;

    align-items: center;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  & > button {
    margin-left: 8px;
  }
`;

const StyledHomeIcon = styled.div`
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
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

  &:hover,
  &:active,
  &.active {
    background: #e1e1e1;
  }

  &:focus {
    outline: none;
  }
`;

const HomeIcon = FormIcons.HOME_ICON;
const DeleteIcon = FormIcons.DELETE_ICON;
const CopyIcon = ControlIcons.COPY_CONTROL;
const DragIcon = ControlIcons.DRAG_CONTROL;

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
    return dispatch(updatePage(item.pageId, item.pageName, true));
  }, [dispatch]);

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
  }, []);

  const enterEditMode = useCallback(() => setIsEditing(true), []);

  return (
    <Container>
      <ListItem>
        <DragIcon
          color={get(theme, "colors.propertyPane.iconColor")}
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
        </EditNameContainer>
        <Actions>
          {item.isDefault && (
            <StyledHomeIcon>
              <DefaultPageIcon
                color={get(theme, "colors.primaryOld")}
                height={20}
                width={20}
              />
            </StyledHomeIcon>
          )}
          <ContextMenu
            applicationId={applicationId}
            onCopy={clonePageCallback}
            onDelete={deletePageCallback}
            onSetPageDefault={setPageAsDefaultCallback}
            onSetPageHidden={setPageHidden}
            page={item}
          />
          <Action type="button">
            <CopyIcon
              color={get(theme, "colors.propertyPane.iconColor")}
              height={16}
              onClick={() => clonePageCallback(item.pageId)}
              width={16}
            />
          </Action>
          <Action type="button">
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
