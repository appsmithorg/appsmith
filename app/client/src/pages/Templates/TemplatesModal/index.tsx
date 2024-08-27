import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  allTemplatesFiltersSelector,
  templateModalSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import {
  getAllTemplates,
  getTemplateFilters,
  hideTemplatesModal,
} from "actions/templateActions";
import { fetchDefaultPlugins } from "actions/pluginActions";
import TemplateDetailedView from "./TemplateDetailedView";
import { isEmpty } from "lodash";
import type { AppState } from "ee/reducers";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@appsmith/ads";
import TemplateModalHeader from "./Header";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import TemplatesListLayoutSwitcher from "./TemplatesListLayoutSwitcher";

const ModalContentWrapper = styled(ModalContent)`
  width: 100%;
  overflow-y: hidden;
  background-color: var(--ads-v2-color-gray-50);
`;
const ModalBodyWrapper = styled(ModalBody)`
  width: 100%;
  overflow-y: hidden;
`;
function TemplatesModal() {
  const templatesModalInfo = useSelector(templateModalSelector);
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);
  const [showTemplateDetails, setShowTemplateDetails] = useState("");

  useEffect(() => {
    setShowTemplateDetails("");
    if (templatesModalInfo.isOpen) {
      dispatch({
        type: ReduxActionTypes.RESET_TEMPLATE_FILTERS,
      });
    }
  }, [templatesModalInfo]);

  useEffect(() => {
    if (!templatesCount && templatesModalInfo) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount, templatesModalInfo]);

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
      dispatch(hideTemplatesModal());
      setShowTemplateDetails("");
    }
  };

  const onTemplateClick = (id: string) => {
    setShowTemplateDetails(id);
  };

  return (
    <Modal
      onOpenChange={(open) => onClose(open)}
      open={templatesModalInfo.isOpen}
    >
      <ModalContentWrapper data-testid="t--templates-dialog-component">
        <ModalHeader>
          <TemplateModalHeader
            className={!showTemplateDetails ? "modal-header" : ""}
          />
        </ModalHeader>
        <ModalBodyWrapper>
          {!!showTemplateDetails ? (
            <TemplateDetailedView
              isStartWithTemplateFlow={templatesModalInfo.isOpenFromCanvas}
              onBackPress={() => setShowTemplateDetails("")}
              onClose={() => onClose(false)}
              templateId={showTemplateDetails}
            />
          ) : (
            <TemplatesListLayoutSwitcher
              analyticsEventNameForTemplateCardClick="TEMPLATE_ADD_PAGE_FROM_TEMPLATE_FLOW"
              isStartWithTemplateFlow={templatesModalInfo.isOpenFromCanvas}
              onTemplateClick={onTemplateClick}
            />
          )}
        </ModalBodyWrapper>
      </ModalContentWrapper>
    </Modal>
  );
}

export default TemplatesModal;
