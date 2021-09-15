import React, { useState } from "react";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";

export default function CreateNewBranchForm({
  onCancel,
  onSubmit,
}: {
  onSubmit: (branchName: string) => void;
  onCancel: () => void;
}) {
  const [branchName, setBranchName] = useState("");

  return (
    <div>
      <div style={{ width: 260 }}>
        <TextInput autoFocus fill onChange={setBranchName} />
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
          onClick={() => onSubmit(branchName)}
          size={Size.small}
          text="Submit"
        />
      </div>
    </div>
  );
}
