import { get, noop } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import { useHistory } from "react-router";
import React, { useCallback, useState, useRef } from "react";

import useClick from "utils/hooks/useClick";
import { updatePage } from "actions/pageActions";
import { MenuIcons } from "icons/MenuIcons";
import { resolveAsSpaceChar } from "utils/helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import { Page } from "constants/ReduxActionConstants";
import EditNameInput from "pages/Editor/Explorer/Entity/Name";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import TooltipComponent from "components/ads/Tooltip";
import { createMessage, GO_TO_PAGE } from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";

const LinkIcon = MenuIcons.LINK_ICON;

export const EditNameContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  padding-left: 4px;

  & > .page-list-item-edit-icon {
    visibility: hidden; /* Hide the visiblity when not hovered */
    margin-left: 8px;
    align-items: center;
  }

  &:hover .page-list-item-edit-icon {
    visibility: visible; /* on Hover display the element */
  }

  & > div {
    display: flex;
    min-height: 36px;
    align-items: center;
  }

  & > div:hover {
    text-decoration: underline;
  }

  & > div:first-child {
    &:hover {
      cursor: pointer;
    }
  }
`;

type Props = {
  page: Page;
};

function EditName(props: Props) {
  const { page } = props;
  const theme = useTheme();
  const dispatch = useDispatch();
  const history = useHistory();
  const [isEditing, setIsEditing] = useState(false);
  const applicationId = useSelector(getCurrentApplicationId);

  const updateNameCallback = useCallback(
    (name: string) => {
      return updatePage(page.pageId, name, !!page.isHidden);
    },
    [dispatch],
  );

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
  }, []);

  const enterEditMode = useCallback(() => setIsEditing(true), []);

  const switchPage = useCallback(() => {
    if (!!applicationId && !isEditing) {
      history.push(
        BUILDER_PAGE_URL({ applicationId, pageId: props.page.pageId }),
      );
    }
  }, [props.page.pageId, applicationId]);

  const handleClick = () => {
    if (!isEditing) enterEditMode();
  };

  const itemRef = useRef<HTMLDivElement | null>(null);
  useClick(itemRef, handleClick, noop);

  return (
    <EditNameContainer>
      <EditNameInput
        enterEditMode={enterEditMode}
        entityId={page.pageId}
        exitEditMode={exitEditMode}
        isEditing={isEditing}
        name={page.pageName}
        nameTransformFn={resolveAsSpaceChar}
        ref={itemRef}
        updateEntityName={updateNameCallback}
      />
      {!isEditing && (
        <div className="page-list-item-edit-icon">
          <TooltipComponent
            content={createMessage(GO_TO_PAGE)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            position={Position.BOTTOM}
          >
            <LinkIcon
              color={get(theme, "colors.pagesEditor.iconColor")}
              height={14}
              onClick={switchPage}
              width={14}
            />
          </TooltipComponent>
        </div>
      )}
    </EditNameContainer>
  );
}

export default EditName;
