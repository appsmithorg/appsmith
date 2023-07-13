import React, { useRef, useState } from "react";
import { Button, Input } from "design-system";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
// import type { EditorProps } from "components/editorComponents/CodeEditor";

const editorProps = {
  mode: EditorModes.JSON_WITH_BINDING,
  size: EditorSize.EXTENDED,
  tabBehaviour: TabBehaviour.INDENT,
  theme: EditorTheme.LIGHT,
  showLightningMenu: false,
  showLineNumbers: true,
  borderLess: true,
};

export const binId = "64afd26cb89b1e2299be44ee";

export function CustomWidgetCreator() {
  const name = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");

  const onEditorChange = (
    event: React.ChangeEvent<HTMLTextAreaElement> | string,
  ) => {
    setValue(event as string);
  };

  const onClick = async () => {
    if (value) {
      try {
        JSON.parse(value);
      } catch (e) {
        alert("invalid json");
        return;
      }
      setIsLoading(true);
      const response = await fetch(
        `https://api.jsonbin.io/v3/b/${binId}/latest`,
      );
      setIsLoading(false);
      const existingValues = await response.json();

      await fetch(`https://api.jsonbin.io/v3/b/${binId}/`, {
        method: "PUT",
        body: JSON.stringify([
          ...existingValues.record,
          {
            ...JSON.parse(value),
            type: Math.random().toString(16).slice(2),
            name: name.current?.value,
          },
        ]),
        headers: new Headers({ "content-type": "application/json" }),
      });
    }
  };

  return (
    <div className="container mx-auto content-center mt-12">
      <h1 className="text-[40px] font-bold text-center">
        Create Custom Widget
      </h1>
      <div className="w-80 mt-4">
        <Input
          label="Widget Name"
          labelPosition="top"
          placeholder="Enter widget name"
          ref={name}
          size="md"
        />
      </div>

      <br />

      <LazyCodeEditor
        {...editorProps}
        input={{
          value: value,
          onChange: onEditorChange,
        }}
      />
      <div className="w-80 mt-4">
        <Input
          label="Component Link"
          labelPosition="top"
          placeholder="Enter Component Link"
          ref={name}
          size="md"
        />
      </div>

      <div className="mt-4">
        <Button isLoading={isLoading} onClick={onClick} size="md">
          Create Widget
        </Button>
      </div>
    </div>
  );
}
