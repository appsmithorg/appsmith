import {
  GraphQLEnumValue,
  GraphQLNamedType,
  GraphQLSchema,
  isAbstractType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
} from "graphql";
import React, { useState } from "react";

import { ExplorerFieldDef } from "./contexts/explorer";
import Argument from "./Argument";
import DefaultValue from "./DefaultValue";
import DeprecationReason from "./DeprecationReason";
import FieldLink from "./FieldLink";
import ExplorerSection from "./ExplorerSection";
import TypeLink from "./TypeLink";
import MarkdownContent from "./MarkdownContent";
import { MultipleArgumentsWrapper, FieldItemWrapper } from "./css";
import { Button } from "design-system";

function ImplementsInterfaces({ type }: { type: GraphQLNamedType }) {
  if (!isObjectType(type)) {
    return null;
  }
  const interfaces = type.getInterfaces();
  return interfaces.length > 0 ? (
    <ExplorerSection title="Implements">
      {type.getInterfaces().map((implementedInterface) => (
        <TypeLink key={implementedInterface.name} type={implementedInterface} />
      ))}
    </ExplorerSection>
  ) : null;
}

function Fields({ type }: { type: GraphQLNamedType }) {
  const [showDeprecated, setShowDeprecated] = useState(false);
  if (
    !isObjectType(type) &&
    !isInterfaceType(type) &&
    !isInputObjectType(type)
  ) {
    return null;
  }

  const fieldMap = type.getFields();

  const fields: ExplorerFieldDef[] = [];
  const deprecatedFields: ExplorerFieldDef[] = [];

  for (const field of Object.keys(fieldMap).map((name) => fieldMap[name])) {
    if (field.deprecationReason) {
      deprecatedFields.push(field);
    } else {
      fields.push(field);
    }
  }

  return (
    <>
      {fields.length > 0 ? (
        <ExplorerSection title="Fields">
          {fields.map((field) => (
            <Field field={field} key={field.name} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedFields.length > 0 ? (
        showDeprecated || fields.length === 0 ? (
          <ExplorerSection title="Deprecated Fields">
            {deprecatedFields.map((field) => (
              <Field field={field} key={field.name} />
            ))}
          </ExplorerSection>
        ) : (
          <Button
            category="tertiary"
            fill
            onClick={() => {
              setShowDeprecated(true);
            }}
            size="large"
            tag="button"
            text="Show Deprecated Arguments"
            type="button"
          >
            Show Deprecated Fields
          </Button>
        )
      ) : null}
    </>
  );
}

function Field({ field }: { field: ExplorerFieldDef }) {
  const args =
    "args" in field
      ? field.args.filter((arg: any) => !arg.deprecationReason)
      : [];
  return (
    <FieldItemWrapper>
      <FieldLink field={field} />
      {args.length > 0 ? (
        <>
          (
          {args.map((arg: any) =>
            args.length === 1 ? (
              <Argument arg={arg} inline key={arg.name} />
            ) : (
              <MultipleArgumentsWrapper key={arg.name}>
                <Argument arg={arg} inline />
              </MultipleArgumentsWrapper>
            ),
          )}
          )
        </>
      ) : null}
      {": "}
      <TypeLink type={field.type} />
      <DefaultValue field={field} />
      {field.description
        ? MarkdownContent.render({
            description: field.description,
            type: "description",
          })
        : null}
      <DeprecationReason description={field.deprecationReason} />
    </FieldItemWrapper>
  );
}

function EnumValues({ type }: { type: GraphQLNamedType }) {
  const [showDeprecated, setShowDeprecated] = useState(false);

  if (!isEnumType(type)) {
    return null;
  }

  const values: GraphQLEnumValue[] = [];
  const deprecatedValues: GraphQLEnumValue[] = [];
  for (const value of type.getValues()) {
    if (value.deprecationReason) {
      deprecatedValues.push(value);
    } else {
      values.push(value);
    }
  }

  return (
    <>
      {values.length > 0 ? (
        <ExplorerSection title="Enum Values">
          {values.map((value) => (
            <EnumValue key={value.name} value={value} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedValues.length > 0 ? (
        showDeprecated || values.length === 0 ? (
          <ExplorerSection title="Deprecated Enum Values">
            {deprecatedValues.map((value) => (
              <EnumValue key={value.name} value={value} />
            ))}
          </ExplorerSection>
        ) : (
          <Button
            category="tertiary"
            fill
            onClick={() => {
              setShowDeprecated(true);
            }}
            size="large"
            tag="button"
            text="Show Deprecated Arguments"
            type="button"
          >
            Show Deprecated Values
          </Button>
        )
      ) : null}
    </>
  );
}

function EnumValue({ value }: { value: GraphQLEnumValue }) {
  return (
    <FieldItemWrapper>
      <div>{value.name}</div>
      {value.description
        ? MarkdownContent.render({
            description: value.description,
            type: "description",
          })
        : null}
      {value.deprecationReason
        ? MarkdownContent.render({
            description: value.deprecationReason,
            type: "deprecation",
          })
        : null}
    </FieldItemWrapper>
  );
}

function PossibleTypes({
  schema,
  type,
}: {
  type: GraphQLNamedType;
  schema: GraphQLSchema;
}) {
  if (!schema || !isAbstractType(type)) {
    return null;
  }
  return (
    <ExplorerSection
      title={isInterfaceType(type) ? "Implementations" : "Possible Types"}
    >
      {schema.getPossibleTypes(type).map((possibleType) => (
        <TypeLink key={possibleType.name} type={possibleType} />
      ))}
    </ExplorerSection>
  );
}

type TypeDocumentationProps = {
  /**
   * The type that should be rendered.
   */
  schema: GraphQLSchema;
  type: GraphQLNamedType;
};

export default function TypeDocumentation(props: TypeDocumentationProps) {
  return isNamedType(props.type) ? (
    <>
      {props.type.description
        ? MarkdownContent.render({
            description: props.type.description,
            type: "description",
          })
        : null}
      <ImplementsInterfaces type={props.type} />
      <Fields type={props.type} />
      <EnumValues type={props.type} />
      <PossibleTypes schema={props.schema} type={props.type} />
    </>
  ) : null;
}
