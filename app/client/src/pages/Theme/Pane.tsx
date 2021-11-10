import { ReduxActionTypes } from "constants/ReduxActionConstants";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

export default function Pane() {
  const dispatch = useDispatch();
  const [background, setBackground] = useState("");
  const onChange = (e: any) => {
    setBackground(e.target.value);
    dispatch({
      type: ReduxActionTypes.SAVE_THEME,
      payload: {
        mainColor: e.target.value,
      },
    });
  };

  return (
    <div>
      <input onChange={onChange} value={background} />
    </div>
  );
}
