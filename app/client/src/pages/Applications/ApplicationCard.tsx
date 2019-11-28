import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { Card, Tooltip, Classes } from "@blueprintjs/core";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import {
  theme,
  getBorderCSSShorthand,
  getColorWithOpacity,
} from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import ContextDropdown, {
  ContextDropdownOption,
} from "components/editorComponents/ContextDropdown";

const Wrapper = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  border-radius: ${props => props.theme.radii[1]}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  &:hover {
    &:after {
      left: 0;
      top: 0;
      content: "";
      position: absolute;
      height: 100%;
      width: 100%;
    }
    & .control {
      display: block;
      z-index: 1;
    }
    & div.image-container {
      background: ${props =>
        getColorWithOpacity(
          props.theme.card.hoverBG,
          props.theme.card.hoverBGOpacity,
        )};
    }
  }
`;
const ApplicationTitle = styled.div`
  font-size: ${props => props.theme.fontSizes[2]}px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  bottom: 0;
  left: 0;
  height: ${props => props.theme.card.titleHeight}px;
  padding: ${props => props.theme.spaces[6]}px;
  width: 100%;
  border-top: ${props => getBorderCSSShorthand(props.theme.card.divider)};
  font-weight: ${props => props.theme.fontWeights[2]};
  font-size: ${props => props.theme.fontSizes[4]}px;
  & {
    span {
      display: inline-block;
    }
    .control {
      display: none;
      z-index: 1;
      position: absolute;
      right: ${props => props.theme.spaces[5] * 3}px;
      top: ${props => props.theme.spaces[5]}px;
    }
    .more {
      z-index: 1;
      position: absolute;
      right: ${props => props.theme.spaces[2]}px;
      top: ${props => props.theme.spaces[4]}px;
      cursor: pointer;
    }
  }
`;

const ApplicationImage = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: calc(100% - ${props => props.theme.card.titleHeight}px);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  & {
    .control {
      display: none;
    }
  }
`;

const Control = styled.button<{ fixed?: boolean }>`
  outline: none;
  background: none;
  border: none;
  cursor: pointer;
`;

const APPLICATION_CONTROL_FONTSIZE_INDEX = 6;

const viewControlIcon = ControlIcons.VIEW_CONTROL({
  width: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX - 1],
  height: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX - 1],
  color: theme.colors.secondary,
});

type ApplicationCardProps = {
  application: ApplicationPayload;
  loading: boolean;
  duplicate: (applicationId: string) => void;
  share: (applicationId: string) => void;
  delete: (applicationId: string) => void;
};

export const ApplicationCard = (props: ApplicationCardProps) => {
  const duplicateApp = () => {
    props.duplicate(props.application.id);
  };
  const shareApp = () => {
    props.share(props.application.id);
  };
  const deleteApp = () => {
    props.delete(props.application.id);
  };
  const moreActionItems: ContextDropdownOption[] = [
    {
      id: "duplicate",
      value: "duplicate",
      onSelect: duplicateApp,
      label: "Duplicate",
    },
    {
      id: "share",
      value: "share",
      onSelect: shareApp,
      label: "Share",
    },
    {
      id: "delete",
      value: "delete",
      onSelect: deleteApp,
      label: "Delete",
      intent: "danger",
    },
  ];
  const viewApplicationURL = getApplicationViewerPageURL(
    props.application.id,
    props.application.defaultPageId,
  );
  const editApplicationURL = BUILDER_PAGE_URL(
    props.application.id,
    props.application.defaultPageId,
  );
  return (
    <Wrapper key={props.application.id}>
      <ApplicationTitle
        className={props.loading ? Classes.SKELETON : undefined}
      >
        <span>{props.application.name}</span>
        <Link to={viewApplicationURL}>
          <Control className="control">
            <Tooltip content="View Application" hoverOpenDelay={500}>
              {viewControlIcon}
            </Tooltip>
          </Control>
        </Link>
        <ContextDropdown
          options={moreActionItems}
          toggle={{
            type: "icon",
            icon: "MORE_VERTICAL_CONTROL",
            iconSize: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
          }}
          className="more"
        />
      </ApplicationTitle>
      <ApplicationImage className="image-container">
        <Control className="control">
          <Link to={editApplicationURL}>
            <Tooltip content="Edit Application" hoverOpenDelay={500}>
              <BaseButton
                icon="edit"
                text="Edit"
                accent="primary"
                filled={true}
              />
            </Tooltip>
          </Link>
        </Control>
      </ApplicationImage>
    </Wrapper>
  );
};

export default ApplicationCard;
