import React, { useEffect } from "react";
import {
  EntityGroupsList,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";

import { CREATE_A_NEW_ITEM, createMessage } from "ee/constants/messages";
import { useGroupedAddQueryOperations } from "ee/pages/AppIDE/EditorPane/Query/hooks";
import { getShowCreateNewModal } from "selectors/ideSelectors";
import { setShowQueryCreateNewModal } from "actions/ideActions";
import { DEFAULT_GROUP_LIST_SIZE } from "../../constants";

const CreateNewQueryModal: React.FC = () => {
  const dispatch = useDispatch();
  const itemGroups = useGroupedAddQueryOperations();
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
          <EntityGroupsList
            groups={itemGroups}
            showDivider
            visibleItems={DEFAULT_GROUP_LIST_SIZE}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { CreateNewQueryModal };
