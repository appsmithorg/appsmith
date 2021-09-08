import React, { useState } from "react";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { IconName } from "components/ads/Icon";
import CreateNewBranchForm from "./CreateNewBranchForm";

const branches = [
  { label: "Master", value: "Master" },
  { label: "Release", value: "Release" },
  { label: "FeatureA", value: "FeatureA" },
  {
    label: "Create New",
    value: "Create New",
    icon: "plus" as IconName,
    data: { isCreateNewOption: true },
  },
];

export default function BranchDropdown() {
  const [showCreateBranchForm, setShowCreateNewBranchForm] = useState(false);

  const handleSelect = (
    value: DropdownOption["value"],
    option: DropdownOption,
  ) => {
    if (option.data?.isCreateNewOption) {
      setShowCreateNewBranchForm(true);
    }
  };

  return showCreateBranchForm ? (
    <CreateNewBranchForm />
  ) : (
    <Dropdown
      onSelect={handleSelect}
      options={branches}
      selected={{ label: "Master", value: "Master" }}
      showLabelOnly
    />
  );
}
