import React from "react";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";

const branches = [
  { label: "Master", value: "Master" },
  { label: "Release", value: "Release" },
  { label: "FeatureA", value: "FeatureA" },
  { label: "Create New", value: "Create New", icon: "plus" },
];

export default function BranchDropdown() {
  return (
    <Dropdown
      options={branches}
      selected={{ label: "Master", value: "Master" }}
      showLabelOnly
    />
  );
}
