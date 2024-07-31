import React from "react";
import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "design-system";
import SectionField from "@appsmith/components/InputsForm/Fields/SectionField";
import Form from "@appsmith/components/InputsForm/Form";
import { generateUniqueId } from "@appsmith/components/InputsForm/Fields/helper";
import { useDispatch, useSelector } from "react-redux";
import { updateQueryParams } from "actions/QueryParamsActions";
import { useActiveActionBaseId } from "@appsmith/pages/Editor/Explorer/hooks";
import { getQueryParams } from "selectors/QueryParamsSelector";

function Params() {
  const dispatch = useDispatch();
  const activeActionBaseId = useActiveActionBaseId();
  const handleUpdate = React.useCallback(
    (value) => {
      if (activeActionBaseId) {
        dispatch(updateQueryParams(activeActionBaseId, value));
      }
    },
    [activeActionBaseId, dispatch],
  );
  const params = useSelector((state) =>
    getQueryParams(state, activeActionBaseId),
  );

  return (
    <Popover>
      <PopoverTrigger>
        <Button endIcon="dropdown" kind="tertiary" size="md">
          Params
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverBody>
          <Text>
            Bind parameter within query using <br />
            <Text
              kind="code"
              style={{ fontSize: "11px" }}
            >{`{{ this.params.paramName }}`}</Text>
          </Text>
          <Form
            blockCompletions={[]}
            dataTreePathPrefix="inputs"
            defaultValues={
              params || {
                inputsForm: [
                  {
                    id: generateUniqueId([]),
                    sectionName: "",
                    children: [],
                  },
                ],
              }
            }
            evaluatedValues={{}}
            onUpdateForm={handleUpdate}
          >
            <SectionField name="inputsForm" />
          </Form>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default Params;
