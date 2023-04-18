import type { ReactNode } from "react";
import React, { useState } from "react";
// import { Dropdown } from "design-system-old";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { noop } from "lodash";
import {
  getForkableWorkspaces,
  isImportingTemplateSelector,
} from "selectors/templatesSelectors";
// import styled from "styled-components";
import { importTemplateToWorkspace } from "actions/templateActions";
import {
  CANCEL,
  CHOOSE_WHERE_TO_FORK,
  createMessage,
  FORK_TEMPLATE,
  SELECT_WORKSPACE,
} from "@appsmith/constants/messages";
// import { Colors } from "constants/Colors";
// import { Classes } from "@blueprintjs/core";

// const ButtonsWrapper = styled.div`
//   display: flex;
//   margin-top: ${(props) => props.theme.spaces[11]}px;
//   gap: ${(props) => props.theme.spaces[4]}px;
//   justify-content: flex-end;
// `;

// const StyledDialog = styled(Dialog)`
//   && {
//     .${Classes.DIALOG_CLOSE_BUTTON} {
//       svg {
//         width: 29px;
//         height: 29px;
//       }
//     }
//   }
// `;

interface ForkTemplateProps {
  children?: ReactNode;
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
    <>
      {children}
      <Modal
        // isOpen={showForkModal}
        onOpenChange={isImportingTemplate ? noop : onClose}
        open={showForkModal}
        // headerIcon={{ name: "fork-2", bgColor: Colors.GEYSER_LIGHT }}
        // onClose={isImportingTemplate ? noop : onClose}
        // title={createMessage(CHOOSE_WHERE_TO_FORK)}
      >
        <ModalContent>
          <ModalHeader>
            {/* <Icon name="fork-2" size="lg" /> */}
            {createMessage(CHOOSE_WHERE_TO_FORK)}
          </ModalHeader>
          <ModalBody>
            <Select
              // boundary="viewport"
              // dropdownMaxHeight={"200px"}
              // fillOptions
              dropdownMatchSelectWidth
              onSelect={(
                // value: any,
                dropdownOption: React.SetStateAction<{
                  value: string;
                  label: string;
                }>,
              ) => setSelectedWorkspace(dropdownOption)}
              options={workspaceList}
              placeholder={createMessage(SELECT_WORKSPACE)}
              value={selectedWorkspace}
              // showLabelOnly
              // width={"100%"}
            />
          </ModalBody>
          <ModalFooter>
            {/* <ButtonsWrapper> */}
            <Button
              isDisabled={isImportingTemplate}
              kind="secondary"
              onClick={onClose}
              size="md"
            >
              {createMessage(CANCEL)}
            </Button>
            <Button
              className="t--fork-template-button"
              isLoading={isImportingTemplate}
              onClick={onFork}
              size="md"
            >
              {createMessage(FORK_TEMPLATE)}
            </Button>
            {/* </ButtonsWrapper> */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ForkTemplate;
