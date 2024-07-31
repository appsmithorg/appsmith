import React, { useState } from "react";
import {
  Button,
  Flex,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "design-system";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";

function Params() {
  const [params, setParams] = useState(["param1"]);

  const handleOnTextChange = React.useCallback(
    (value: string, index: number) => {
      setParams(
        params.map((p, i) => {
          if (i === index) {
            return value;
          }
          return p;
        }),
      );
    },
    [params],
  );

  const handleDeleteClick = React.useCallback(
    (index: number) => {
      setParams(params.filter((p, i) => i !== index));
    },
    [params],
  );

  const handleAddNewClick = React.useCallback(() => {
    setParams([...params, `param${params.length + 1}`]);
  }, [params]);

  return (
    <Popover>
      <PopoverTrigger>
        <Button endIcon="dropdown" kind="tertiary" size="md">
          Params
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverBody>
          <Text>
            Bind parameter within query using <br />
            <Text
              kind="code"
              style={{ fontSize: "11px" }}
            >{`{{ this.params.paramName }}`}</Text>
          </Text>
          <Flex flexDirection="column" p="spaces-2" width={"100%"}>
            {params.map((p, i) => (
              <EditableParam
                index={i}
                key={i}
                onDeleteClick={handleDeleteClick}
                onTextChange={handleOnTextChange}
                value={p}
              />
            ))}
          </Flex>
          <Button
            data-testid="t--add-param-btn"
            kind="secondary"
            onClick={handleAddNewClick}
            size="md"
            startIcon="plus"
          >
            Add Param
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

const Container = styled(Flex)`
  & > div {
    width: calc(100% - 34px) !important;
  }
  & > div > div {
    width: 100%;
    justify-content: space-between;
  }
`;

function EditableParam(props: {
  value: string;
  index: number;
  onTextChange: (value: string, index: number) => void;
  onDeleteClick: (index: number) => void;
}) {
  const { index, onDeleteClick, onTextChange } = props;
  const [showingActions, setShowActions] = React.useState<boolean>(false);
  const handleOnTextChange = React.useCallback(
    (value) => {
      onTextChange(value, index);
    },
    [index, onTextChange],
  );
  const handleDeleteClick = React.useCallback(() => {
    onDeleteClick(index);
  }, [onDeleteClick, index]);
  const hideActions = () => setShowActions(false);
  const showActions = () => setShowActions(true);
  return (
    <div onMouseEnter={showActions} onMouseLeave={hideActions}>
      <Container alignItems="center" justifyContent="space-between">
        <EditableText
          defaultValue={props.value}
          editInteractionKind={EditInteractionKind.SINGLE}
          hideEditIcon={!showingActions}
          isEditingDefault
          onTextChanged={handleOnTextChange}
          placeholder=""
          type="text"
        />
        {showingActions ? (
          <Button
            data-testid="t--delete-input-btn"
            kind="tertiary"
            onClick={handleDeleteClick}
            startIcon="trash"
            tabIndex={-1}
          />
        ) : (
          <div style={{ width: "34px" }} />
        )}
      </Container>
    </div>
  );
}

export default Params;
