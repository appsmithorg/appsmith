import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  GO_BACK,
  START_WITH_TEMPLATE_CONNECT_HEADING,
  START_WITH_TEMPLATE_CONNECT_SUBHEADING,
  createMessage,
} from "ee/constants/messages";
import type { AppState } from "ee/reducers";
import { fetchDefaultPlugins } from "actions/pluginActions";
import {
  getAllTemplates,
  getTemplateFilters,
  importTemplateToWorkspace,
  setActiveLoadingTemplateId,
} from "actions/templateActions";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import {
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@appsmith/ads";
import { isEmpty } from "lodash";
import { TemplateView } from "pages/Templates/TemplateView";
import TemplatesListLayoutSwitcher from "pages/Templates/TemplatesModal/TemplatesListLayoutSwitcher";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  activeLoadingTemplateId,
  allTemplatesFiltersSelector,
  getTemplatesSelector,
  templatesCountSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
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
  const modadBodyRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showTemplateDetails && modadBodyRef.current) {
      modadBodyRef.current.scrollTop = 0;
    }
  }, [showTemplateDetails]);

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

  const handleSimilarTemplateClick = (template: TemplateInterface) => {
    if (typeof template === "string") {
      template = getTemplateById(template) as TemplateInterface;
    }
    if (!template) return;

    AnalyticsUtil.logEvent("TEMPLATE_SELECT_NEW_APP_FLOW", {
      templateId: template.id,
      templateName: template.title,
    });
    onTemplateClick(template);
  };

  const onTemplateClick = (template: TemplateInterface | string) => {
    const templateId = typeof template === "string" ? template : template.id;
    !loadingTemplateId && setShowTemplateDetails(templateId);
  };

  const onClickUseTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      AnalyticsUtil.logEvent("FORK_TEMPLATE_NEW_APP_FLOW", {
        templateId: template.id,
        templateName: template.title,
      });
      dispatch(setActiveLoadingTemplateId(templateId));
      dispatch(importTemplateToWorkspace(templateId, currentWorkSpaceId));
    }
  };

  return (
    <Modal onOpenChange={(open) => onClose(open)} open={isOpen}>
      <ModalContentWrapper data-testid="t--create-app-from-templates-dialog-component">
        <ModalHeader>
          {!showTemplateDetails ? (
            <StartWithTemplatesHeader
              isModalLayout
              subtitle={createMessage(START_WITH_TEMPLATE_CONNECT_SUBHEADING)}
              title={createMessage(START_WITH_TEMPLATE_CONNECT_HEADING)}
            />
          ) : (
            <Link
              data-testid="t--template-view-goback"
              onClick={() => setShowTemplateDetails("")}
              startIcon="arrow-left-line"
            >
              {createMessage(GO_BACK)}
            </Link>
          )}
        </ModalHeader>
        <ModalBodyWrapper
          isDetailedView={!!showTemplateDetails}
          ref={modadBodyRef}
        >
          {!!showTemplateDetails ? (
            <TemplateView
              handleBackPress={() => setShowTemplateDetails("")}
              handleSimilarTemplateClick={handleSimilarTemplateClick}
              isModalLayout
              onClickUseTemplate={onClickUseTemplate}
              showBack={false}
              showSimilarTemplate
              similarTemplatesClassName="!p-0"
              templateId={showTemplateDetails}
            />
          ) : (
            <TemplatesListLayoutSwitcher
              analyticsEventNameForTemplateCardClick="TEMPLATE_SELECT_NEW_APP_FLOW"
              isForkingEnabled
              onForkTemplateClick={onClickUseTemplate}
              onTemplateClick={onTemplateClick}
            />
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
