import React from "react";
import { Select } from "@design-system/widgets";
import { Item } from "@react-stately/collections";

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
  ];

  // return <Select defaultItems={options} label="asdasda" />;

  return (
    <Select items={options} label="Example">
      {(item: any) => <Item key={item.name}>{item.name}</Item>}
    </Select>
  );
};
