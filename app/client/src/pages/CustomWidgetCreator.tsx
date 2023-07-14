import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Option, Select } from "design-system";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { DropdownOption } from "components/editorComponents/WidgetQueryGeneratorForm/CommonControls/DatasourceDropdown/DropdownOption";

type SelectOptionType = {
  label: string;
  value: any;
};

const DEFAULT_OPTION = {
  label: "Create a new widget config",
  value: "new_widget",
};

const getWidgetConfigByName = (widgetConfigs: any, name: string) =>
  widgetConfigs.filter((config: any) => config.name === name)[0];

const removeWidgetConfigByType = (widgetConfigs: any, type: string) =>
  widgetConfigs.filter((config: any) => config.type !== type);

const editorProps = {
  mode: EditorModes.JSON_WITH_BINDING,
  size: EditorSize.EXTENDED,
  tabBehaviour: TabBehaviour.INDENT,
  theme: EditorTheme.LIGHT,
  showLightningMenu: false,
  showLineNumbers: true,
  borderLess: true,
  height: 350,
};

export const binId = "64b0eba8b89b1e2299beb04a";
const xMasterKey =
  "$2b$10$ut89lMno/ZUHIPi4WGUxs.K0Phzvw4heUpIgfVdxCVyuDWP/Wtg.O";

export function CustomWidgetCreator() {
  const componentLinkRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [value, setValue] = useState("");
  const [widgetConfigs, setWidgetConfigs] = useState<any>();
  const [selectOptions, setSelectOptions] = useState<SelectOptionType[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [widgetName, setWidgetName] = useState("");

  const onEditorChange = (
    event: React.ChangeEvent<HTMLTextAreaElement> | string,
  ) => {
    setValue(event as string);
  };

  const onUpdate = async () => {
    if (value) {
      let parsedValue;
      try {
        if (typeof value !== "object") {
          parsedValue = JSON.parse(value);
        } else {
          parsedValue = value;
        }
      } catch (e) {
        alert("invalid json");
        return;
      }

      // New or update widget payload
      let payload;
      if (selectedOption === "new_widget") {
        payload = [
          ...widgetConfigs.record,
          {
            ...parsedValue,
            defaults: {
              ...parsedValue.defaults,
              componentLink:
                componentLinkRef && componentLinkRef.current?.value,
            },
            type: Math.random().toString(16).slice(2),
            iconSVG: iconRef && iconRef.current?.value,
            name: widgetName,
          },
        ];
      } else {
        const remainingConfigs = removeWidgetConfigByType(
          widgetConfigs.record,
          parsedValue.type,
        );

        payload = [
          ...remainingConfigs,
          {
            ...parsedValue,
            defaults: {
              ...parsedValue.defaults,
              componentLink:
                componentLinkRef && componentLinkRef.current?.value,
            },
            type: Math.random().toString(16).slice(2),
            iconSVG: iconRef && iconRef.current?.value,
            name: widgetName,
          },
        ];
      }

      setIsUpdating(true);
      await fetch(`https://api.jsonbin.io/v3/b/${binId}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: new Headers({
          "content-type": "application/json",
          "X-Master-Key": xMasterKey,
        }),
      });
      setIsUpdating(false);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    await fetch(`https://api.jsonbin.io/v3/b/${binId}/`, {
      method: "DELETE",
      headers: new Headers({
        "content-type": "application/json",
        "X-Master-Key": xMasterKey,
      }),
    });
    setIsDeleting(false);
  };

  useEffect(() => {
    // get all widget configs
    (async () => {
      setIsLoading(true);
      const response = await fetch(
        `https://api.jsonbin.io/v3/b/${binId}/latest`,
        {
          method: "GET",
          headers: new Headers({
            "content-type": "application/json",
            "X-Master-Key": xMasterKey,
          }),
        },
      );
      const configs = await response.json();
      setWidgetConfigs(configs);

      // set select options
      setSelectOptions([
        DEFAULT_OPTION,
        ...configs.record.map((config: any) => ({
          label: config.name,
          value: config.name,
        })),
      ]);
      setIsLoading(false);
    })();
  }, []);

  // console.log({ widgetConfigs, selectOptions });
  return (
    <div className="container mx-auto content-center mt-12">
      <h1 className="text-[40px] font-bold text-center">
        Create Custom Widget
      </h1>

      <div className="w-80 mt-4">
        <Select
          dropdownStyle={{
            maxHeight: "300px",
          }}
          isLoading={isLoading}
          onSelect={(value: string) => {
            setSelectedOption(value);
            setWidgetName(value);
            setValue(
              getWidgetConfigByName((widgetConfigs as any).record, value),
            );
          }}
          placeholder="Select a widget config"
          virtual={false}
        >
          {selectOptions.map((option: SelectOptionType) => {
            return (
              <Option
                data-testId="t--one-click-binding-table-selector--table"
                key={`option-${option.value}`}
                value={option.value}
              >
                <DropdownOption label={option.label} />
              </Option>
            );
          })}
        </Select>
      </div>

      <div className="w-80 mt-4">
        <Input
          label="Widget Name"
          labelPosition="top"
          onChange={(e: string) => setWidgetName(e)}
          placeholder="Enter widget name"
          size="md"
          value={widgetName === "new_widget" ? "" : widgetName}
        />
      </div>

      <br />

      <LazyCodeEditor
        {...editorProps}
        input={{
          value:
            selectedOption === "new_widget" || selectedOption === ""
              ? ""
              : getWidgetConfigByName(
                  (widgetConfigs as any).record,
                  selectedOption,
                ),
          onChange: onEditorChange,
        }}
      />

      <div className="w-80 mt-4">
        <Input
          label="Component Link"
          labelPosition="top"
          placeholder="Enter link to the custom component gist"
          ref={componentLinkRef}
          size="md"
        />
      </div>

      <div className="w-80 mt-4">
        <Input
          label="Widget Icon"
          labelPosition="top"
          placeholder="Paste icon svg"
          ref={iconRef}
          renderAs="textarea"
          size="md"
        />
      </div>

      <div className="flex justify-between">
        {selectedOption === "new_widget" || selectedOption === "" ? (
          <div className="mt-4">
            <Button
              isLoading={isUpdating}
              onClick={onUpdate}
              size="md"
              startIcon="plus"
            >
              Create Widget
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button isLoading={isUpdating} onClick={onUpdate} size="md">
              Update Widget
            </Button>
          </div>
        )}

        {selectedOption !== "" && selectedOption !== "new_widget" && (
          <div className="mt-4">
            <Button
              isLoading={isDeleting}
              kind="error"
              onClick={onDelete}
              size="md"
              startIcon="delete"
            >
              Remove Widget
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
