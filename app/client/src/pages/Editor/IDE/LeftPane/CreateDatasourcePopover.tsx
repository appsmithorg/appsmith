import { Button, Popover, PopoverTrigger } from "design-system";
import React from "react";
import history from "utils/history";
import { builderURL } from "@appsmith/RouteBuilder";

const CreateDatasourcePopover = () => {
  return (
    <Popover open={false}>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="tertiary"
          onClick={() =>
            history.push(
              builderURL({
                suffix: "datasources/NEW",
              }),
            )
          }
          size="sm"
          startIcon="add-line"
        />
      </PopoverTrigger>
    </Popover>
  );
};

export default CreateDatasourcePopover;
