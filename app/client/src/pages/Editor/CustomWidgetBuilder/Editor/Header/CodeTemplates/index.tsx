import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
} from "@appsmith/ads";
import React, { useContext, useState } from "react";
import codeTemplates from "./Templates";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
import styles from "../styles.module.css";
import type { SrcDoc } from "pages/Editor/CustomWidgetBuilder/types";
import styled from "styled-components";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledButton = styled(Button)`
  height: 32px !important;

  & .ads-v2-button__content-children {
    font-size: 14px;
    font-weight: 400;
  }
`;

function ConfirmationModal(props: {
  open: boolean;
  onOpenChange: (flag: boolean) => void;
  onCancel: () => void;
  onReplace: () => void;
}) {
  return (
    <Modal
      onOpenChange={(flag: boolean) => props.onOpenChange(flag)}
      open={props.open}
    >
      <ModalContent
        style={{
          width: "580px",
        }}
      >
        <ModalHeader>
          {createMessage(CUSTOM_WIDGET_FEATURE.template.modal.header)}
        </ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {createMessage(CUSTOM_WIDGET_FEATURE.template.modal.body)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={props.onCancel} size="md">
            {createMessage(CUSTOM_WIDGET_FEATURE.template.modal.cancelCTA)}
          </Button>
          <Button onClick={props.onReplace} size="md">
            {createMessage(CUSTOM_WIDGET_FEATURE.template.modal.successCTA)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function CodeTemplates() {
  const { bulkUpdate, initialSrcDoc, lastSaved, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const [open, setOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<SrcDoc | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  return (
    <div className={styles.templateMenu}>
      <Menu>
        <MenuTrigger>
          <StyledButton
            className="t--custom-widget-template-trigger"
            kind="secondary"
            onClick={() => {
              AnalyticsUtil.logEvent("CUSTOM_WIDGET_BUILDER_TEMPLATE_OPENED", {
                widgetId: widgetId,
              });
            }}
            size="sm"
            startIcon="query"
          >
            {createMessage(CUSTOM_WIDGET_FEATURE.template.buttonCTA)}
          </StyledButton>
        </MenuTrigger>
        <MenuContent>
          {initialSrcDoc && lastSaved && (
            <>
              <MenuItem
                onClick={() => {
                  setSelectedTemplate(initialSrcDoc);
                  setSelectedTemplateName(
                    CUSTOM_WIDGET_FEATURE.template.revert,
                  );
                  setOpen(true);
                  AnalyticsUtil.logEvent(
                    "CUSTOM_WIDGET_BUILDER_TEMPLATE_SELECT",
                    {
                      widgetId: widgetId,
                      templateName: CUSTOM_WIDGET_FEATURE.template.revert,
                    },
                  );
                }}
              >
                {createMessage(CUSTOM_WIDGET_FEATURE.template.revert)}
              </MenuItem>
              <MenuSeparator />
            </>
          )}
          {codeTemplates.map((template) => (
            <MenuItem
              key={template.key}
              onClick={() => {
                setSelectedTemplate(template.uncompiledSrcDoc);
                setSelectedTemplateName(template.key);
                setOpen(true);
                AnalyticsUtil.logEvent(
                  "CUSTOM_WIDGET_BUILDER_TEMPLATE_SELECT",
                  {
                    widgetId: widgetId,
                    templateName: template.key,
                  },
                );
              }}
            >
              {template.key}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
      <ConfirmationModal
        onCancel={() => {
          setSelectedTemplate(null);
          setSelectedTemplateName("");
          setOpen(false);
          AnalyticsUtil.logEvent(
            "CUSTOM_WIDGET_BUILDER_TEMPLATE_SELECT_CANCELED",
            {
              widgetId: widgetId,
              templateName: selectedTemplateName,
            },
          );
        }}
        onOpenChange={(flag: boolean) => {
          if (!flag) {
            setSelectedTemplate(null);
            setSelectedTemplateName("");
            setOpen(false);
            AnalyticsUtil.logEvent(
              "CUSTOM_WIDGET_BUILDER_TEMPLATE_SELECT_CANCELED",
              {
                widgetId: widgetId,
                templateName: selectedTemplateName,
              },
            );
          }
        }}
        onReplace={() => {
          selectedTemplate && bulkUpdate?.(selectedTemplate);
          setSelectedTemplate(null);
          setSelectedTemplateName("");
          setOpen(false);
          AnalyticsUtil.logEvent(
            "CUSTOM_WIDGET_BUILDER_TEMPLATE_SELECT_CONFIRMED",
            {
              widgetId: widgetId,
              templateName: selectedTemplateName,
            },
          );
        }}
        open={open}
      />
    </div>
  );
}
