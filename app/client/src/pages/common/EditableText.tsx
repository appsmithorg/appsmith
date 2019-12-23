import React, { useState } from "react";
import { EditableText as BlueprintEditableText } from "@blueprintjs/core";

type EditableTextProps = {
  type: "text" | "password" | "email" | "phone" | "date";
  defaultValue: string;
  onTextChanged: (value: string) => void;
};

export const EditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const edit = () => setIsEditing(true);
  return (
    <div onDoubleClick={edit}>
      <BlueprintEditableText
        disabled={!isEditing}
        isEditing={isEditing}
        {...props}
        onConfirm={props.onTextChanged}
        selectAllOnFocus
      />
    </div>
  );
};

export default EditableText;
