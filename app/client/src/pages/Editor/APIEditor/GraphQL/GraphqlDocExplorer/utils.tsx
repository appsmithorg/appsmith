import React from "react";
import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
  GraphQLType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
} from "graphql";

export function renderType(
  type: GraphQLType,
  renderNamedType: (namedType: GraphQLNamedType) => JSX.Element,
): JSX.Element {
  if (isNonNullType(type)) {
    return <>{renderType(type.ofType, renderNamedType)}!</>;
  }
  if (isListType(type)) {
    return <>[{renderType(type.ofType, renderNamedType)}]</>;
  }
  return renderNamedType(type);
}

export type TypeMatch = { type: GraphQLNamedType };

export type FieldMatch = {
  type: GraphQLNamedType;
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

export type SearchResultType = {
  within: FieldMatch[];
  types: TypeMatch[];
  fields: FieldMatch[];
};

function isMatch(sourceText: string, searchValue: string) {
  try {
    const escaped = searchValue.replace(/[^_0-9A-Za-z]/g, (ch) => "\\" + ch);
    return sourceText.search(new RegExp(escaped, "i")) !== -1;
  } catch (e) {
    return sourceText.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
  }
}

export function getSearchResults(
  schema: any,
  searchValue: string,
  stackItem: any,
) {
  const matches: SearchResultType = {
    within: [],
    types: [],
    fields: [],
  };

  if (!schema || searchValue.length === 0) {
    return matches;
  }

  const withinType = stackItem.def;

  const typeMap = schema.getTypeMap();
  let typeNames = Object.keys(typeMap);

  // Move the within type name to be the first searched.
  if (withinType) {
    typeNames = typeNames.filter((n) => n !== withinType.name);
    typeNames.unshift(withinType.name);
  }

  for (const typeName of typeNames) {
    if (
      matches.within.length + matches.types.length + matches.fields.length >=
      100
    ) {
      break;
    }

    const type = typeMap[typeName];
    if (withinType !== type && isMatch(typeName, searchValue)) {
      matches.types.push({ type });
    }

    if (
      !isObjectType(type) &&
      !isInterfaceType(type) &&
      !isInputObjectType(type)
    ) {
      continue;
    }

    const fields = type.getFields();
    for (const fieldName in fields) {
      const field = fields[fieldName];
      let matchingArgs: GraphQLArgument[] | undefined;

      if (!isMatch(fieldName, searchValue)) {
        if ("args" in field) {
          matchingArgs = field.args.filter((arg) =>
            isMatch(arg.name, searchValue),
          );
          if (matchingArgs.length === 0) {
            continue;
          }
        } else {
          continue;
        }
      }

      matches[withinType === type ? "within" : "fields"].push(
        ...(matchingArgs
          ? matchingArgs.map((argument) => ({ type, field, argument }))
          : [{ type, field }]),
      );
    }
  }

  return matches;
}
