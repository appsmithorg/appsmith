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
} from "design-system";
import { EditFieldsButton } from "../styles";
import { Table } from "design-system-old";
import styled from "styled-components";
import { uniqBy } from "lodash";
import { klona } from "klona";

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

export function ColumnSelectorModal(props: any) {
  const { data, onSave } = props;
  const [isModalOpen, setIsModalOpen] = useState(!!props.isOpen);
  const [updatedData, setUpdatedData] = useState<any>([]);

  useEffect(() => {
    const clonedData = klona(data);
    setUpdatedData([...clonedData]);
  }, [data]);

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const setIsOpen = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    props.onOpenOrClose && props.onOpenOrClose(isOpen);
  };

  const onOpenChange = (isOpen: boolean) => {
    props?.onClose?.();
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
    onSave(updatedData);
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
