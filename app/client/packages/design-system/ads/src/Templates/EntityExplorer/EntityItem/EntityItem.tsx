import React, { useMemo, useState } from "react";
import { ListItem } from "../../../List";
import type { EntityItemProps } from "./EntityItem.types";
import { ContentTextWrapper } from "../../../List/List.styles";
// import { usePrevious } from "@mantine/hooks";
import { useEventCallback } from "usehooks-ts";
import { normaliseName } from "./utils";
import { EntityEditableName } from "./EntityItem.styled";

export const EntityItem = (props: EntityItemProps) => {
  // const previousName = usePrevious(props.name);
  const [editableName, setEditableName] = useState(props.name);

  const handleTitleChange = useEventCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = normaliseName(e.target.value);

      setEditableName(value);
      props.nameEditorConfig?.validateName(value);
    },
  );

  const inputProps = useMemo(
    () => ({
      onChange: handleTitleChange,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        height: "32px",
        top: 0,
      },
    }),
    [handleTitleChange],
  );

  const customTitle = useMemo(() => {
    if (!props.nameEditorConfig) {
      return <ContentTextWrapper>{props.name}</ContentTextWrapper>;
    } else {
      return (
        <EntityEditableName inputProps={inputProps} isEditable kind="body-m">
          {editableName}
        </EntityEditableName>
      );
    }
  }, [editableName, inputProps, props.name, props.nameEditorConfig]);

  return <ListItem {...props} customTitleComponent={customTitle} />;
};
