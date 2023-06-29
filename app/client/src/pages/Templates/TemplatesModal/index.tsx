import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  allTemplatesFiltersSelector,
  templateModalOpenSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import {
  getAllTemplates,
  getTemplateFilters,
  showTemplatesModal,
} from "actions/templateActions";
import TemplatesList from "./TemplateList";
import { fetchDefaultPlugins } from "actions/pluginActions";
import TemplateDetailedView from "./TemplateDetailedView";
import { isEmpty } from "lodash";
import type { AppState } from "@appsmith/reducers";
import { Modal, ModalBody, ModalContent, ModalHeader } from "design-system";
import TemplateModalHeader from "./Header";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const ModalContentWrapper = styled(ModalContent)`
  width: 100%;
  overflow-y: hidden;
`;
const ModalBodyWrapper = styled(ModalBody)`
  width: 100%;
  overflow-y: hidden;
`;
function TemplatesModal() {
  const templatesModalOpen = useSelector(templateModalOpenSelector);
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);
  const [showTemplateDetails, setShowTemplateDetails] = useState("");

  useEffect(() => {
    setShowTemplateDetails("");
    if (templatesModalOpen) {
      dispatch({
        type: ReduxActionTypes.RESET_TEMPLATE_FILTERS,
      });
    }
  }, [templatesModalOpen]);

  useEffect(() => {
    if (!templatesCount && templatesModalOpen) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount, templatesModalOpen]);

  useEffect(() => {
    if (!pluginListLength) {
      dispatch(fetchDefaultPlugins());
    }
  }, [pluginListLength]);

  useEffect(() => {
    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }
  }, [filters]);

  const onClose = (open: boolean) => {
    if (open === false) {
      dispatch(showTemplatesModal(false));
      setShowTemplateDetails("");
    }
  };

  const onTemplateClick = (id: string) => {
    setShowTemplateDetails(id);
  };

  return (
    <Modal onOpenChange={(open) => onClose(open)} open={templatesModalOpen}>
      <ModalContentWrapper data-testid="t--templates-dialog-component">
        <ModalHeader>
          {!!showTemplateDetails ? (
            <TemplateModalHeader
              onBackPress={() => setShowTemplateDetails("")}
              // onClose={() => onClose(false)}
            />
          ) : (
            <TemplateModalHeader
              className="modal-header"
              hideBackButton
              // onClose={() => onClose(false)}
            />
          )}
        </ModalHeader>
        <ModalBodyWrapper>
          {!!showTemplateDetails ? (
            <TemplateDetailedView
              onBackPress={() => setShowTemplateDetails("")}
              onClose={() => onClose(false)}
              templateId={showTemplateDetails}
            />
          ) : (
            <TemplatesList
              onClose={() => onClose(false)}
              onTemplateClick={onTemplateClick}
            />
          )}
        </ModalBodyWrapper>
      </ModalContentWrapper>
    </Modal>
  );
}

export default TemplatesModal;
