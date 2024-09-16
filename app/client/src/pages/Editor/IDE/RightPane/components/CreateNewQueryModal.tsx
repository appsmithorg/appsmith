import React, { useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";

import { CREATE_A_NEW_ITEM, createMessage } from "ee/constants/messages";
import GroupedList from "pages/Editor/IDE/EditorPane/components/GroupedList";
import {
  useAddQueryListItems,
  useGroupedAddQueryOperations,
} from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { getShowCreateNewModal } from "selectors/ideSelectors";
import { setShowQueryCreateNewModal } from "actions/ideActions";

const CreateNewQueryModal: React.FC = () => {
  const dispatch = useDispatch();
  const groupedActionOperations = useGroupedAddQueryOperations();
  const { getListItems } = useAddQueryListItems();
  const showCreateNewModal = useSelector(getShowCreateNewModal);

  const onCloseHandler = (open: boolean) => {
    if (!open) {
      dispatch(setShowQueryCreateNewModal(false));
    }
  };

  useEffect(() => {
    // to avoid opening the pop up again when page navigates back to canvas
    return () => {
      onCloseHandler(false);
    };
  }, []);

  return (
    <Modal onOpenChange={onCloseHandler} open={showCreateNewModal}>
      <ModalContent className="!w-[400px] action-creator-create-new-modal">
        <ModalHeader>{createMessage(CREATE_A_NEW_ITEM, "query")}</ModalHeader>
        <ModalBody>
          <GroupedList
            groups={groupedActionOperations.map((group) => ({
              groupTitle: group.title,
              className: group.className,
              items: getListItems(group.operations),
            }))}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { CreateNewQueryModal };
