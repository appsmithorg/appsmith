import React, { ReactNode } from "react";
import { Position } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import TooltipComponent from "components/ads/Tooltip";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import FormRow from "components/editorComponents/FormRow";
import { MoreActionsMenu } from "pages/Editor/Explorer/Actions/MoreActionsMenu";
import Button, { Size } from "components/ads/Button";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { BUILDER_PAGE_URL } from "constants/routes";

export const NameWrapper = styled.div`
  width: 49%;
  display: flex;
  align-items: center;

  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const IconContainer = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  cursor: pointer;

  svg {
    width: 12px;
    height: 12px;
    path {
      fill: ${(props) => props.theme.colors.apiPane.closeIcon};
    }
  }
  &:hover {
    background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg};
  }
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }

  & ul li a {
    margin-top: 0;
  }
`;

interface ActionHeaderProps {
  actionTitle: ReactNode;
  currentActionConfigId: string;
  currentActionConfigName: string;
  onRunClick: () => void;
  isLoading: boolean;
  runButtonClassName: string;
  popModifier?: any;
}

const ActionHeader = (props: ActionHeaderProps) => {
  const history = useHistory();
  const location = useLocation();
  const { applicationId, pageId } = useParams<ExplorerURLParams>();

  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );
    e.stopPropagation();
    history.replace(BUILDER_PAGE_URL(applicationId, pageId));
  };

  return (
    <FormRow className="form-row-header">
      <NameWrapper className="t--nameOfApi">
        <TooltipComponent
          minimal
          position={Position.BOTTOM}
          content={
            <Text type={TextType.P3} style={{ color: "#ffffff" }}>
              Close
            </Text>
          }
        >
          <IconContainer onClick={handleClose}>
            <Icon
              name="close-modal"
              size={IconSize.LARGE}
              className="close-modal-icon"
            />
          </IconContainer>
        </TooltipComponent>
        {props.actionTitle}
      </NameWrapper>

      <ActionButtons className="t--formActionButtons">
        <MoreActionsMenu
          id={props.currentActionConfigId || ""}
          name={props.currentActionConfigName || ""}
          className="t--more-action-menu"
          pageId={pageId}
          popModifier={props.popModifier}
        />

        <Button
          text="Run"
          tag="button"
          size={Size.medium}
          type="button"
          onClick={props.onRunClick}
          isLoading={props.isLoading}
          className={props.runButtonClassName}
        />
      </ActionButtons>
    </FormRow>
  );
};

ActionHeader.defaultProps = {};

export default ActionHeader;
