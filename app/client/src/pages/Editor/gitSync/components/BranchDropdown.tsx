import React, { useState } from "react";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { IconName } from "components/ads/Icon";
import CreateNewBranchForm from "./CreateNewBranchForm";
import {
  createNewBranchInit,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import { useDispatch } from "react-redux";

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

export default function BranchDropdown(props: {
  setShowCreateNewBranchForm?: (flag: boolean) => void;
}) {
  const [showCreateBranchForm, setShowCreateNewBranchFormInState] = useState(
    false,
  );
  const setShowCreateNewBranchForm = (flag: boolean) => {
    setShowCreateNewBranchFormInState(flag);
    if (typeof props.setShowCreateNewBranchForm === "function") {
      props.setShowCreateNewBranchForm(flag);
    }
  };

  const dispatch = useDispatch();

  const handleSelect = (
    value: DropdownOption["value"],
    option: DropdownOption,
  ) => {
    let updatedShowCreateBranchForm = false;
    if (option.data?.isCreateNewOption) {
      updatedShowCreateBranchForm = true;
    }
    setShowCreateNewBranchForm(updatedShowCreateBranchForm);

    if (!option.data?.isCreateNewOption) {
      if (value) dispatch(switchGitBranchInit(value));
    }
  };

  const handleCreateNewBranch = (branchName: string) => {
    dispatch(createNewBranchInit(branchName));
  };

  return showCreateBranchForm ? (
    <CreateNewBranchForm
      onCancel={() => setShowCreateNewBranchForm(false)}
      onSubmit={handleCreateNewBranch}
    />
  ) : (
    <Dropdown
      dontUsePortal
      fillOptions
      onSelect={handleSelect}
      options={branches}
      selected={{ label: "Master", value: "Master" }}
      showLabelOnly
    />
  );
}
