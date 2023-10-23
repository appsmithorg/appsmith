import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverTrigger,
  Text,
} from "design-system";
import { useSelector, useDispatch } from "react-redux";

import { starterTemplateDatasourcePromptSelector } from "selectors/templatesSelectors";
import { toggleStarterTemplateDatasourcePrompt } from "actions/templateActions";

function DatasourceStarterLayoutPrompt() {
  const dispatch = useDispatch();
  const showDatasourcePrompt = useSelector(
    starterTemplateDatasourcePromptSelector,
  );

  const togglePrompt = () => dispatch(toggleStarterTemplateDatasourcePrompt());

  return (
    <Popover onOpenChange={togglePrompt} open={showDatasourcePrompt}>
      <PopoverTrigger>
        <div />
      </PopoverTrigger>

      <PopoverContent align="start" className="z-[25]" side="left" size="md">
        <PopoverHeader className="sticky top-0" isClosable>
          {"Bring your data in!"}
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <Text kind="body-m">
            Your application is now using sample data, but with Appsmith you can
            do much more! Click on Data, and make this application yours in a
            blink!
          </Text>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default DatasourceStarterLayoutPrompt;
