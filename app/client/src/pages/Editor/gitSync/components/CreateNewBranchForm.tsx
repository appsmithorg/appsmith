import React from "react";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";

export default function CreateNewBranchForm({
  defaultBranchValue,
  isCreatingNewBranch,
  isInputValid,
  onCancel,
  onChange,
  onSubmit,
}: {
  defaultBranchValue: string;
  isCreatingNewBranch: boolean;
  isInputValid: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  const setBranch = (value: string) => {
    if (typeof onChange === "function") onChange(value);
  };

  return (
    <div>
      <div style={{ width: 300 }}>
        <TextInput
          autoFocus
          defaultValue={defaultBranchValue}
          fill
          onChange={setBranch}
          // validator={() => ({ isValid: isInputValid, message: "" })}
        />
      </div>
      <Space size={6} />
      <div style={{ display: "flex" }}>
        <Button
          category={Category.tertiary}
          onClick={onCancel}
          size={Size.small}
          text="Cancel"
        />
        <Space horizontal size={3} />
        <Button
          category={Category.primary}
          className="t--create-new-branch-submit-button"
          disabled={!isInputValid}
          isLoading={isCreatingNewBranch}
          onClick={onSubmit}
          size={Size.small}
          text="Submit"
        />
      </div>
    </div>
  );
}
