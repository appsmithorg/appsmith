import React, { useRef, MutableRefObject } from "react";
import { BaseButton } from "../../components/designSystems/blueprint/ButtonComponent";
import { ControlGroup, Classes } from "@blueprintjs/core";

type CreateApplicationFormProps = {
  onCreate: (name: string) => void;
  creating: boolean;
  error?: string;
};

export const CreateApplicationForm = (props: CreateApplicationFormProps) => {
  const inputRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
  const handleCreate = () => {
    if (inputRef && inputRef.current) {
      props.onCreate(inputRef.current.value);
    } else {
      //TODO (abhinav): Add validation code.
    }
  };
  return (
    <ControlGroup fill vertical>
      <input
        type="text"
        className={Classes.INPUT}
        ref={inputRef}
        placeholder="Application Name"
      />
      <BaseButton
        text="Create Application"
        onClick={handleCreate}
        styleName="secondary"
        loading={props.creating}
      ></BaseButton>
    </ControlGroup>
  );
};

export default CreateApplicationForm;
