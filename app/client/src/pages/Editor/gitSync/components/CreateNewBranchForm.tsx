import React, { useState } from "react";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";

export default function CreateNewBranchForm({
  onCancel,
  onSubmit,
}: {
  onSubmit: (branch: string) => void;
  onCancel: () => void;
}) {
  const [branch, setBranch] = useState("");

  return (
    <div>
      <div style={{ width: 260 }}>
        <TextInput autoFocus fill onChange={setBranch} />
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
          onClick={() => onSubmit(branch)}
          size={Size.small}
          text="Submit"
        />
      </div>
    </div>
  );
}
