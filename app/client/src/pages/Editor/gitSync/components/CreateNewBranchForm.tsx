import React, { useState } from "react";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";

export default function CreateNewBranchForm({
  defaultBranchValue,
  isCreatingNewBranch,
  onCancel,
  onChange,
  onSubmit,
}: {
  defaultBranchValue: string;
  isCreatingNewBranch: boolean;
  onSubmit: (branchName: string) => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}) {
  const [branchName, setBranchNameInState] = useState(defaultBranchValue);
  const setBranchName = (value: string) => {
    setBranchNameInState(value);
    if (typeof onChange === "function") onChange(value);
  };

  return (
    <div>
      <div style={{ width: 300 }}>
        <TextInput
          autoFocus
          defaultValue={defaultBranchValue}
          fill
          onChange={setBranchName}
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
          isLoading={isCreatingNewBranch}
          onClick={() => onSubmit(branchName)}
          size={Size.small}
          text="Submit"
        />
      </div>
    </div>
  );
}
