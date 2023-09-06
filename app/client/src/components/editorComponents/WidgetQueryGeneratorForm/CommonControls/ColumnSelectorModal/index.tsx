import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Tooltip,
} from "design-system";
import { EditFieldsButton } from "../../styles";
import styled from "styled-components";
import { useColumns } from "../../WidgetSpecificControls/ColumnDropdown/useColumns";
import {
  CANCEL_DIALOG,
  COLUMN_NAME,
  COLUMN_TYPE,
  createMessage,
  EDIT_FIELDS,
  EDIT_FIELDS_DISABLED_TOOLTIP_TEXT,
  FIELDS_CONFIGURATION,
  SAVE_CHANGES,
  SAVE_CHANGES_DISABLED_TOOLTIP_TEXT,
} from "@appsmith/constants/messages";
import EditFieldsTable from "./EditFieldsTable";
import { WidgetQueryGeneratorFormContext } from "../../index";

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
  padding-top: 0 !important;

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

const FlexWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: inherit;
  background-color: ${(props) =>
    props.disabled ? "var(--ads-v2-color-bg-muted)" : "transparent"};
`;

export function ColumnSelectorModal({ isDisabled }: { isDisabled?: boolean }) {
  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);
  const { columns: data, primaryColumn } = useColumns("", false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originalColumns, setOriginalColumns] = useState<string[]>([]); // to reset the selected columns on cancel
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // to update the selected columns on save

  useEffect(() => {
    if (data) {
      const initialSelectedColumns =
        config?.selectedColumns && config?.selectedColumns.length > 0
          ? config.selectedColumns
          : data
              .filter((column: any) => column.isSelected)
              .map((column: any) => column.name);
      setSelectedColumns(initialSelectedColumns);
      setOriginalColumns(initialSelectedColumns);
    }
  }, [data, config]);

  const updatedData = useMemo(() => {
    return data?.map((column: any) => {
      return {
        ...column,
        isSelected: selectedColumns?.includes(column.name),
      };
    });
  }, [data, selectedColumns]);

  const isSaveDisabled = useMemo(() => {
    return updatedData?.every((column: any) => !column.isSelected);
  }, [updatedData]);

  const handleSelect = (row: any, isSelected: boolean) => {
    if (row) {
      const col = row.original;
      setSelectedColumns((prevSelectedColumns) => {
        if (isSelected) {
          return [...prevSelectedColumns, col.name];
        } else {
          return prevSelectedColumns.filter((name) => name !== col.name);
        }
      });
    }
  };

  const onCancel = () => {
    setSelectedColumns(originalColumns);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    updateConfig("selectedColumns", selectedColumns);
    setOriginalColumns(selectedColumns);
    setIsModalOpen(false);
  };

  const handleModalState = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
      onCancel();
    }
  };

  const columns = [
    {
      Header: createMessage(COLUMN_NAME),
      accessor: "name",
      Cell: function (cellProps: any) {
        const { row } = cellProps;
        const isDisabled = row.original.name === primaryColumn;
        return (
          <FlexWrapper>
            <StyledCheckbox
              data-column-id={`t--edit-field-${row.original.name}`}
              isDisabled={isDisabled}
              isSelected={row.original.isSelected}
              onChange={(isSelected) => handleSelect(row, isSelected)}
            />
            <ColumnText>{row.original.name}</ColumnText>
          </FlexWrapper>
        );
      },
    },
    {
      Header: createMessage(COLUMN_TYPE),
      accessor: "type",
      Cell: function (cellProps: any) {
        const { row } = cellProps;
        return <Text>{row.original.type}</Text>;
      },
    },
  ];

  return (
    <div data-testid="t--column-selector-modal">
      <Tooltip content={createMessage(EDIT_FIELDS_DISABLED_TOOLTIP_TEXT)}>
        <span>
          <EditFieldsButton
            data-testid="t--edit-fields-button"
            isDisabled={isDisabled}
            kind="tertiary"
            onClick={() => setIsModalOpen(true)}
            startIcon="edit-2-line"
          >
            {createMessage(EDIT_FIELDS)}
          </EditFieldsButton>
        </span>
      </Tooltip>
      <Modal
        onOpenChange={(isOpen) => handleModalState(isOpen)}
        open={isModalOpen}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>
            <Text kind="heading-m" renderAs="h1">
              {createMessage(FIELDS_CONFIGURATION)}
            </Text>
          </ModalHeader>
          <StyledModalBody>
            <EditFieldsTable
              columns={columns}
              data={updatedData || []}
              rowProps={(row: any) => {
                const isDisabled = row.original.name === primaryColumn;
                return {
                  onClick: () => isDisabled && null,
                  style: {
                    opacity: isDisabled ? "0.5" : "1",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  },
                };
              }}
            />
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
            <Tooltip
              content={
                isSaveDisabled
                  ? createMessage(SAVE_CHANGES_DISABLED_TOOLTIP_TEXT)
                  : null
              }
            >
              <span>
                <Button
                  data-testid="t--edit-fields-save-btn"
                  isDisabled={isSaveDisabled}
                  onClick={handleSave}
                  size="md"
                >
                  {createMessage(SAVE_CHANGES)}
                </Button>
              </span>
            </Tooltip>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
