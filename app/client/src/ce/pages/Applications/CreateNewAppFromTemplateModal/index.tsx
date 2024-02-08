import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  START_WITH_TEMPLATE_CONNECT_HEADING,
  START_WITH_TEMPLATE_CONNECT_SUBHEADING,
  createMessage,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";
import { fetchDefaultPlugins } from "actions/pluginActions";
import {
  getAllTemplates,
  getTemplateFilters,
  importTemplateToWorkspace,
  setActiveLoadingTemplateId,
} from "actions/templateActions";
import { Modal, ModalBody, ModalContent } from "design-system";
import { isEmpty } from "lodash";
import { TemplateView } from "pages/Templates/TemplateView";
import TemplatesListLayoutSwitcher from "pages/Templates/TemplatesModal/TemplatesListLayoutSwitcher";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  activeLoadingTemplateId,
  allTemplatesFiltersSelector,
  getTemplatesSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { StartWithTemplatesHeader } from "../StartWithTemplatesWrapper";

interface CreateNewAppFromTemplatesModalProps {
  currentWorkSpaceId: string;
  isOpen: boolean;
  handleClose: (open: boolean) => void;
}

function CreateNewAppFromTemplatesModal({
  currentWorkSpaceId,
  handleClose,
  isOpen,
}: CreateNewAppFromTemplatesModalProps) {
  const dispatch = useDispatch();
  const templatesCount = useSelector(templatesCountSelector);
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);
  const [showTemplateDetails, setShowTemplateDetails] = useState("");
  const allTemplates = useSelector(getTemplatesSelector);
  const loadingTemplateId = useSelector(activeLoadingTemplateId);

  useEffect(() => {
    setShowTemplateDetails("");
    dispatch(setActiveLoadingTemplateId(""));
    dispatch({
      type: ReduxActionTypes.RESET_TEMPLATE_FILTERS,
    });
  }, [isOpen]);

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount]);

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
      handleClose(open);
      setShowTemplateDetails("");
    }
  };

  const getTemplateById = (id: string) => {
    const template = allTemplates.find((template) => template.id === id);
    return template;
  };

  const onTemplateClick = (id: string) => {
    !loadingTemplateId && setShowTemplateDetails(id);
  };

  const onClickUseTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      dispatch(setActiveLoadingTemplateId(templateId));
      dispatch(importTemplateToWorkspace(templateId, currentWorkSpaceId));
    }
  };

  return (
    <Modal onOpenChange={(open) => onClose(open)} open={isOpen}>
      <ModalContentWrapper data-testid="t--create-app-from-templates-dialog-component">
        <ModalBodyWrapper isDetailedView={!!showTemplateDetails}>
          {!!showTemplateDetails ? (
            <TemplateView
              handleBackPress={() => setShowTemplateDetails("")}
              handleSimilarTemplateClick={onTemplateClick}
              isModalLayout
              onClickUseTemplate={onClickUseTemplate}
              showSimilarTemplate
              similarTemplatesClassName="!p-0"
              templateId={showTemplateDetails}
            />
          ) : (
            <>
              <StartWithTemplatesHeader
                isModalLayout
                subtitle={createMessage(START_WITH_TEMPLATE_CONNECT_SUBHEADING)}
                title={createMessage(START_WITH_TEMPLATE_CONNECT_HEADING)}
              />
              <TemplatesListLayoutSwitcher
                isForkingEnabled
                onForkTemplateClick={onClickUseTemplate}
                onTemplateClick={onTemplateClick}
              />
            </>
          )}
        </ModalBodyWrapper>
      </ModalContentWrapper>
    </Modal>
  );
}

export default CreateNewAppFromTemplatesModal;

const ModalContentWrapper = styled(ModalContent)`
  width: 100%;
  overflow-y: hidden;
  background-color: var(--ads-v2-color-gray-50);
`;
const ModalBodyWrapper = styled(ModalBody)<{ isDetailedView?: boolean }>`
  width: 100%;
  overflow-y: ${(props) => (props.isDetailedView ? "scroll" : "hidden")};
  padding-top: 0;
`;
