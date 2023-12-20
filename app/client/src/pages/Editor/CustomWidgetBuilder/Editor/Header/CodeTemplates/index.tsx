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
} from "design-system";
import React, { useContext, useState } from "react";
import codeTemplates from "./Templates";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
import styles from "../styles.module.css";
import type { SrcDoc } from "pages/Editor/CustomWidgetBuilder/types";
import styled from "styled-components";

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
        <ModalHeader>Are you sure?</ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            This will replace the current changes in the HTML, CSS and JS files.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={props.onCancel} size="sm">
            Cancel
          </Button>
          <Button onClick={props.onReplace} size="sm">
            Replace
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function CodeTemplates() {
  const { bulkUpdate, initialSrcDoc, lastSaved } = useContext(
    CustomWidgetBuilderContext,
  );

  const [open, setOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<SrcDoc | null>(null);

  return (
    <div className={styles.templateMenu}>
      <Menu>
        <MenuTrigger>
          <StyledButton kind="secondary" size="sm" startIcon="query" style={{}}>
            Templates
          </StyledButton>
        </MenuTrigger>
        <MenuContent>
          {initialSrcDoc && lastSaved && (
            <>
              <MenuItem
                onClick={() => {
                  setSelectedTemplate(initialSrcDoc);
                  setOpen(true);
                }}
              >
                Revert to Original
              </MenuItem>
              <MenuSeparator />
            </>
          )}
          {codeTemplates.map((template) => (
            <MenuItem
              key={template.key}
              onClick={() => {
                setSelectedTemplate(template.uncompiledSrcDoc);
                setOpen(true);
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
          setOpen(false);
        }}
        onOpenChange={(flag: boolean) => {
          if (!flag) {
            setSelectedTemplate(null);
            setOpen(false);
          }
        }}
        onReplace={() => {
          selectedTemplate && bulkUpdate?.(selectedTemplate);
          setSelectedTemplate(null);
          setOpen(false);
        }}
        open={open}
      />
    </div>
  );
}
