import React from "react";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";

export default function CreateNewBranchForm() {
  return (
    <div>
      <TextInput />
      <div style={{ display: "flex" }}>
        <Button category={Category.tertiary} size={Size.small} text="Cancel" />
        <Button category={Category.primary} size={Size.small} text="Submit" />
      </div>
    </div>
  );
}
