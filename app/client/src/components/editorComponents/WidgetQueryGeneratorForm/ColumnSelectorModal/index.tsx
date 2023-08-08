import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Checkbox,
  ModalFooter,
  Button,
} from "design-system";
import { EditFieldsButton } from "../styles";
import { Table } from "design-system-old";
import styled from "styled-components";
import { uniqBy } from "lodash";
import { klona } from "klona";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";
import { WidgetQueryGeneratorFormContext } from "..";
import {
  CANCEL_DIALOG,
  COLUMN_NAME,
  COLUMN_TYPE,
  EDIT_FIELDS,
  FIELDS_CONFIGURATION,
  SAVE_CHANGES,
  createMessage,
} from "@appsmith/constants/messages";

const StyledCheckbox = styled(Checkbox)`
  input {
    position: relative !important;
  }
  input[type="checkbox"]:checked + span {
    border-color: transparent;
    background-color: var(--ads-v2-color-orange-500);
  }
`;

const StyledModalBody = styled(ModalBody)`
  padding-top: 0px !important;
  table {
    border: 1px solid var(--ads-v2-color-border-muted) !important;
    thead {
      z-index: 3 !important;
    }
  }
`;

const ColumnText = styled(Text)`
  font-weight: 500;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export function ColumnSelectorModal() {
  const { columns: data } = useColumns("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedData, setUpdatedData] = useState<any>([]);

  const { updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  useEffect(() => {
    const clonedData = klona(data);
    setUpdatedData([...clonedData]);
  }, [data]);

  const setIsOpen = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
  };

  const onOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const handleSelect = (col: any) => {
    if (col) {
      col.isSelected = !col.isSelected;
      const uniqColumns = uniqBy([...updatedData, col], "name");
      setUpdatedData(uniqColumns);
    }
  };

  const onCancel = () => {
    setUpdatedData(data);
    setIsOpen(false);
  };

  const handleSave = () => {
    const selectedColumnNames = updatedData
      .filter((col: any) => col.isSelected)
      .map((col: any) => col.name);
    updateConfig("selectedColumnNames", selectedColumnNames);
    setIsOpen(false);
  };

  const columns = [
    {
      Header: createMessage(COLUMN_NAME),
      accessor: "name",
      Cell: function (cellProps: any) {
        const { row } = cellProps;
        return (
          <FlexWrapper>
            <StyledCheckbox
              data-column-id={`t--edit-field-${row.original.name}`}
              isSelected={row.original.isSelected}
              onChange={() => handleSelect(row.original)}
            />
            <ColumnText>{row.original.name}</ColumnText>
          </FlexWrapper>
        );
      },
    },
    {
      Header: createMessage(COLUMN_TYPE),
      accessor: "type",
    },
  ];

  return (
    <div data-testid="t--column-selector-modal">
      <EditFieldsButton
        data-testid="t--edit-fields-button"
        kind="tertiary"
        onClick={() => setIsOpen(true)}
        startIcon="edit-2-line"
      >
        {createMessage(EDIT_FIELDS)}
      </EditFieldsButton>
      <Modal
        onOpenChange={(isOpen) => isModalOpen && onOpenChange(isOpen)}
        open={isModalOpen}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>
            <Text kind="heading-m" renderAs="h1">
              {createMessage(FIELDS_CONFIGURATION)}
            </Text>
          </ModalHeader>
          <StyledModalBody>
            <Table columns={columns} data={updatedData || []} />
          </StyledModalBody>
          <ModalFooter>
            <Button
              data-testid="t--edit-fields-cancel-btn"
              kind="secondary"
              onClick={onCancel}
              size="md"
            >
              {createMessage(CANCEL_DIALOG)}
            </Button>
            <Button
              data-testid="t--edit-fields-save-btn"
              onClick={handleSave}
              size="md"
            >
              {createMessage(SAVE_CHANGES)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
