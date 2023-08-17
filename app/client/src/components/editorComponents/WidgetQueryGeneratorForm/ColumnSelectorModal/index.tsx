import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Checkbox,
  ModalFooter,
  Button,
  Tooltip,
} from "design-system";
import { EditFieldsButton } from "../styles";
import styled from "styled-components";
import { uniqBy } from "lodash";
import { klona } from "klona";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";
import {
  CANCEL_DIALOG,
  COLUMN_NAME,
  COLUMN_TYPE,
  EDIT_FIELDS_DISABLED_TOOLTIP_TEXT,
  EDIT_FIELDS,
  FIELDS_CONFIGURATION,
  SAVE_CHANGES,
  createMessage,
} from "@appsmith/constants/messages";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import EditFieldsTable from "./EditFieldsTable";

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

const FlexWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  background-color: ${(props) =>
    props.disabled ? "var(--ads-v2-color-bg-muted)" : "transparent"};
`;

export function ColumnSelectorModal({ isDisabled }: { isDisabled?: boolean }) {
  const { columns: data, primaryColumn } = useColumns("", false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedData, setUpdatedData] = useState<any>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const clonedData = klona(data);
    setUpdatedData([...clonedData]);
    updateSelectedColumnNames(clonedData);
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

  const updateSelectedColumnNames = (data: any[]) => {
    const selectedColumnNames = data
      .filter((col: any) => col.isSelected)
      .map((col: any) => col.name);
    dispatch({
      type: ReduxActionTypes.SET_SELECTED_COLUMNS,
      payload: selectedColumnNames,
    });
  };

  const handleSave = () => {
    updateSelectedColumnNames(updatedData);
    setIsOpen(false);
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
            onClick={() => setIsOpen(true)}
            startIcon="edit-2-line"
          >
            {createMessage(EDIT_FIELDS)}
          </EditFieldsButton>
        </span>
      </Tooltip>
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
            <EditFieldsTable
              columns={columns}
              data={updatedData || []}
              rowProps={(row: any) => {
                const isDisabled = row.original.name === primaryColumn;
                return {
                  onClick: () => isDisabled && null,
                  style: {
                    backgroundColor: isDisabled
                      ? "var(--ads-v2-color-bg-subtle)"
                      : "transparent",
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
