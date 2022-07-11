import React, { ReactNode, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import Dropdown from "components/ads/Dropdown";
import Button, { Category, Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import { noop } from "lodash";
import {
  getForkableWorkspaces,
  isImportingTemplateSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { importTemplateToWorkspace } from "actions/templateActions";
import {
  CANCEL,
  CHOOSE_WHERE_TO_FORK,
  createMessage,
  FORK_TEMPLATE,
  SELECT_WORKSPACE,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { Classes } from "@blueprintjs/core";

const ButtonsWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  gap: ${(props) => props.theme.spaces[4]}px;
  justify-content: flex-end;
`;

const StyledDialog = styled(Dialog)`
  && {
    .${Classes.DIALOG_CLOSE_BUTTON} {
      svg {
        width: 29px;
        height: 29px;
      }
    }
  }
`;

interface ForkTemplateProps {
  children: ReactNode;
  showForkModal: boolean;
  onClose: (e?: React.MouseEvent<HTMLElement>) => void;
  templateId: string;
}

function ForkTemplate({
  children,
  onClose,
  showForkModal,
  templateId,
}: ForkTemplateProps) {
  const workspaceList = useSelector(getForkableWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceList[0]);
  const isImportingTemplate = useSelector(isImportingTemplateSelector);
  const dispatch = useDispatch();
  const onFork = () => {
    dispatch(importTemplateToWorkspace(templateId, selectedWorkspace.value));
  };

  return (
    <StyledDialog
      canOutsideClickClose={!isImportingTemplate}
      headerIcon={{ name: "fork-2", bgColor: Colors.GEYSER_LIGHT }}
      isOpen={showForkModal}
      onClose={isImportingTemplate ? noop : onClose}
      title={createMessage(CHOOSE_WHERE_TO_FORK)}
      trigger={children}
    >
      <Dropdown
        boundary="viewport"
        dropdownMaxHeight={"200px"}
        fillOptions
        onSelect={(_value, dropdownOption) =>
          setSelectedWorkspace(dropdownOption)
        }
        options={workspaceList}
        placeholder={createMessage(SELECT_WORKSPACE)}
        selected={selectedWorkspace}
        showLabelOnly
        width={"100%"}
      />
      <ButtonsWrapper>
        <Button
          category={Category.tertiary}
          disabled={isImportingTemplate}
          onClick={onClose}
          size={Size.large}
          tag="button"
          text={createMessage(CANCEL)}
        />
        <Button
          className="t--fork-template-button"
          isLoading={isImportingTemplate}
          onClick={onFork}
          size={Size.large}
          tag="button"
          text={createMessage(FORK_TEMPLATE)}
        />
      </ButtonsWrapper>
    </StyledDialog>
  );
}

export default ForkTemplate;
