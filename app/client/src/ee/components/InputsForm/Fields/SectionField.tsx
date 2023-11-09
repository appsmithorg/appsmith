import React, { Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import HiddenField from "./HiddenField";
import GroupField from "./InputGroupField";

interface SectionFieldProps {
  name: string;
}

function SectionField({ name }: SectionFieldProps) {
  const { control } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: "inputsForm",
  });

  return (
    <div>
      {fields.map((item, index) => {
        return (
          <Fragment key={item.id}>
            <HiddenField name={`${name}.${index}.id`} />
            <HiddenField name={`${name}.${index}.sectionName`} />
            <GroupField name={`${name}.${index}.children`} />
          </Fragment>
        );
      })}
    </div>
  );
}

export default SectionField;
