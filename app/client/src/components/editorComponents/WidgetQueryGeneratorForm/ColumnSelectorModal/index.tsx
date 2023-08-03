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
      Header: "Column name",
      accessor: "name",
      Cell: function (cellProps: any) {
        const { row } = cellProps;
        return (
          <FlexWrapper>
            <StyledCheckbox
              isSelected={row.original.isSelected}
              onChange={() => handleSelect(row.original)}
            />
            <ColumnText>{row.original.name}</ColumnText>
          </FlexWrapper>
        );
      },
    },
    {
      Header: "Type column type",
      accessor: "type",
    },
  ];

  return (
    <>
      <EditFieldsButton
        kind="tertiary"
        onClick={() => setIsOpen(true)}
        startIcon="edit-2-line"
      >
        Edit fields
      </EditFieldsButton>
      <Modal
        onOpenChange={(isOpen) => isModalOpen && onOpenChange(isOpen)}
        open={isModalOpen}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>
            <Text kind="heading-m" renderAs="h1">
              Fields Configuration
            </Text>
          </ModalHeader>
          <StyledModalBody>
            <Table columns={columns} data={updatedData || []} />
          </StyledModalBody>
          <ModalFooter>
            <Button kind="secondary" onClick={onCancel} size="md">
              Cancel
            </Button>
            <Button onClick={handleSave} size="md">
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
