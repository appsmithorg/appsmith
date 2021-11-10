import { FormGroup } from "@blueprintjs/core";
import { ButtonBorderRadiusTypes } from "components/constants";
import Dropdown from "components/designSystems/appsmith/Dropdown";
import TextInputComponent, {
  TextInput,
} from "components/designSystems/appsmith/TextInputComponent";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import SelectComponent from "components/editorComponents/SelectComponent";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppState } from "reducers";
import { useSelector } from "store";

export default function Pane() {
  const dispatch = useDispatch();
  const { backgroundColor, borderRadius, mainColor } = useSelector(
    (state: AppState) => state.theme,
  );
  const onChange = (name: string) => (e: any) => {
    dispatch({
      type: ReduxActionTypes.SAVE_THEME,
      payload: {
        [name]: e.target.value,
      },
    });
  };
  const borderRadiusOption = [
    ButtonBorderRadiusTypes.SHARP,
    ButtonBorderRadiusTypes.ROUNDED,
  ];
  return (
    <div>
      <FormGroup label="background">
        <input onChange={onChange("backgroundColor")} value={backgroundColor} />
      </FormGroup>
      <FormGroup label="mainColor">
        <input onChange={onChange("mainColor")} value={mainColor} />
      </FormGroup>
      <FormGroup label="border-radius">
        <select onChange={onChange("borderRadius")}>
          {borderRadiusOption.map((option) => (
            <option key={option} selected={option == borderRadius}>
              {option}
            </option>
          ))}
        </select>
      </FormGroup>
    </div>
  );
}
