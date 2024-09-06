import React from "react";
import CurlImportForm from "pages/Editor/CurlImport/CurlImportForm";
import ModalControls from "pages/Editor/CurlImport/ModalControls";
import { curlImportSubmitHandler } from "pages/Editor/CurlImport/helpers";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getNewEntityName } from "ee/selectors/entitiesSelector";
import { DEFAULT_PREFIX } from "sagas/ActionSagas";
import {
  ActionParentEntityType,
  CreateNewActionKey,
} from "ee/entities/Engine/actionHelpers";

const AppCURLImportModal = () => {
  const pageId = useSelector(getCurrentPageId);
  const actionName = useSelector((state) =>
    getNewEntityName(state, {
      prefix: DEFAULT_PREFIX.API,
      parentEntityId: pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    }),
  );
  const initialFormValues = {
    contextId: pageId,
    contextType: ActionParentEntityType.PAGE,
    name: actionName,
  };
  return (
    <ModalControls>
      <CurlImportForm
        curlImportSubmitHandler={curlImportSubmitHandler}
        initialValues={initialFormValues}
      />
    </ModalControls>
  );
};

export default AppCURLImportModal;
