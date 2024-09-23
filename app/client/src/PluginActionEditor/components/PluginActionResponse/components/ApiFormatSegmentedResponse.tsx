import React, { useCallback, useMemo, useState } from "react";
import { isArray, isString } from "lodash";
import { isHtml } from "components/editorComponents/utils";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { SegmentedControlContainer } from "pages/Editor/QueryEditor/EditorJSONtoForm";
import { Flex, SegmentedControl } from "@appsmith/ads";
import type { ActionResponse } from "api/ActionAPI";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { ResponseDisplayFormats } from "constants/ApiEditorConstants/CommonApiConstants";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { ResponseFormatTabs } from "./ResponseFormatTabs";

const ResponseBodyContainer = styled.div`
  overflow-y: clip;
  height: 100%;
  display: grid;
`;

function ApiFormatSegmentedResponse(props: {
  actionResponse: ActionResponse;
  actionId: string;
  responseTabHeight: number;
}) {
  const dispatch = useDispatch();
  const onResponseTabSelect = useCallback(
    (tab: string) => {
      dispatch(
        setActionResponseDisplayFormat({
          id: props.actionId,
          field: "responseDisplayFormat",
          value: tab,
        }),
      );
    },
    [dispatch, props.actionId],
  );

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(props.actionResponse);

  let filteredResponseDataTypes: { key: string; title: string }[] = [
    ...responseDataTypes,
  ];

  if (!!props.actionResponse.body && !isArray(props.actionResponse.body)) {
    filteredResponseDataTypes = responseDataTypes.filter(
      (item) => item.key !== ResponseDisplayFormats.TABLE,
    );

    if (responseDisplayFormat.title === ResponseDisplayFormats.TABLE) {
      onResponseTabSelect(filteredResponseDataTypes[0]?.title);
    }
  }

  const responseTabs =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: (
          <ResponseFormatTabs
            data={
              props.actionResponse.body as string | Record<string, unknown>[]
            }
            responseType={dataType.key}
            tableBodyHeight={props.responseTabHeight}
          />
        ),
      };
    });

  const segmentedControlOptions =
    responseTabs &&
    responseTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const onChange = useCallback(
    (value: string) => {
      setSelectedControl(value);
      onResponseTabSelect(value);
    },
    [onResponseTabSelect],
  );

  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );

  const selectedTabIndex =
    filteredResponseDataTypes &&
    filteredResponseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  const value = useMemo(
    () => ({ value: props.actionResponse.body as string }),
    [props.actionResponse.body],
  );

  return (
    <ResponseBodyContainer>
      {isString(props.actionResponse?.body) &&
      isHtml(props.actionResponse?.body) ? (
        <ReadOnlyEditor folding height={"100%"} input={value} />
      ) : responseTabs && responseTabs.length > 0 && selectedTabIndex !== -1 ? (
        <SegmentedControlContainer>
          <Flex>
            <SegmentedControl
              data-testid="t--response-tab-segmented-control"
              defaultValue={segmentedControlOptions[0]?.value}
              isFullWidth={false}
              onChange={onChange}
              options={segmentedControlOptions}
              value={selectedControl}
            />
          </Flex>
          <ResponseFormatTabs
            data={
              props.actionResponse?.body as string | Record<string, unknown>[]
            }
            responseType={selectedControl || segmentedControlOptions[0]?.value}
            tableBodyHeight={props.responseTabHeight}
          />
        </SegmentedControlContainer>
      ) : null}
    </ResponseBodyContainer>
  );
}

export default ApiFormatSegmentedResponse;
