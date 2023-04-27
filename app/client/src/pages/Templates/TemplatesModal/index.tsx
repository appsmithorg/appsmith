import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
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
import { Modal, ModalContent } from "design-system";

const ModalContentWrapper = styled(ModalContent)`
  width: 90%;
  overflow-y: hidden;
`;

function TemplatesModal() {
  const templatesModalOpen = useSelector(templateModalOpenSelector);
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const filters = useSelector(
    (state: AppState) => state.ui.templates.allFilters,
  );
  const [showTemplateDetails, setShowTemplateDetails] = useState("");

  useEffect(() => {
    setShowTemplateDetails("");
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
      <ModalContentWrapper>
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
      </ModalContentWrapper>
    </Modal>
  );
}

export default TemplatesModal;
