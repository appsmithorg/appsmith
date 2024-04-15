import React from "react";
import { Select } from "@design-system/widgets";

export const SelectExample = () => {
  const options = [
    { id: 1, name: "Aerospace" },
    { id: 2, name: "Mechanical" },
    { id: 3, name: "Civil" },
    { id: 4, name: "Biomedical" },
    { id: 5, name: "Nuclear" },
    { id: 6, name: "Industrial" },
    { id: 7, name: "Chemical" },
    { id: 8, name: "Agricultural" },
    { id: 9, name: "Electrical" },
    { id: 11, name: "Aerospace" },
    { id: 12, name: "Mechanical" },
    { id: 13, name: "Civil" },
    { id: 14, name: "Biomedical" },
    { id: 15, name: "Nuclear" },
    { id: 16, name: "Industrial" },
    { id: 17, name: "Chemical" },
    { id: 18, name: "Agricultural" },
    { id: 19, name: "Electrical" },
  ];

  return (
    <Select
      disabledKeys={[2]}
      items={options}
      label="Example"
      onSelectionChange={(e) => console.log(e)}
    />
  );
};
