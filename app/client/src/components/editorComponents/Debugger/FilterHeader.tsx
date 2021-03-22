import React from "react";
import Dropdown from "components/ads/Dropdown";

const FilterHeader = (props: any) => {
  return (
    <div style={{ marginLeft: "30px", padding: "5px 0" }}>
      <Dropdown
        width={"100px"}
        height={"28px"}
        optionWidth={"100px"}
        options={props.options}
        showLabelOnly
        selected={props.selected}
        onSelect={props.onSelect}
      />
    </div>
  );
};

export default FilterHeader;
