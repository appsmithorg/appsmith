import React, { useRef } from "react";
import { useListBox } from "@react-aria/listbox";
import { Option } from "./Option";

export const ListBox = (props: any) => {
  const ref = useRef(null);
  const { listBoxRef = ref, state } = props;
  const { listBoxProps } = useListBox(props, state, listBoxRef);

  return (
    <ul
      {...listBoxProps}
      ref={listBoxRef}
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        maxHeight: 150,
        overflow: "auto",
        width: "100%",
      }}
    >
      {[...state.collection].map((item) => (
        <Option item={item} key={item.key} state={state} />
      ))}
    </ul>
  );
};
