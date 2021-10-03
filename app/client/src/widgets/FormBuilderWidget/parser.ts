import { camelCase, cloneDeep, difference, startCase } from "lodash";
import {
  DATA_TYPE_POTENTIAL_FIELD,
  DataType,
  Schema,
  SchemaObject,
} from "./constants";

type Obj = Record<string, any>;
type JSON = Obj | Obj[];

type ObjectToSchemaProps = {
  currFormData?: JSON;
  prevFormData?: JSON;
  currSchema?: Schema;
};

/**
 *
 * This method takes in array of object and squishes every object in the
 * array into single object thus making sure that all the keys are
 * in single object.
 *
 * @example
 *  Input - [{ firstName: "John", age: 20 }, { lastName: "Doe", age: 30 }]
 *  Output - { firstName: "John", age: 20, lastName: "Doe" }
 */

// TODO: Improve logic to look into all the array items to get the proper object
export const constructPlausibleObjectFromArray = (arrayOfObj: Obj[]) => {
  let plausibleObj = {};

  arrayOfObj.forEach((obj) => {
    plausibleObj = {
      ...plausibleObj,
      ...obj,
    };
  });

  return plausibleObj;
};

export const normalizeToObject = (data: JSON) => {
  if (Array.isArray(data)) {
    return constructPlausibleObjectFromArray(data);
  }

  return data;
};

export const dataTypeFor = (value: any) => {
  const typeOfValue = typeof value;
  if (Array.isArray(value)) return DataType.ARRAY;

  return typeOfValue as DataType;
};

class Parser {
  static nameAndTitle = (key: string) => {
    return {
      name: camelCase(key),
      title: startCase(key),
    };
  };

  // TODO: Better name? and add eg
  static getSchemaObjectFor = (
    key: string,
    value: any,
    options: ObjectToSchemaProps = {},
  ): SchemaObject => {
    const dataType = dataTypeFor(value);
    const fieldType = DATA_TYPE_POTENTIAL_FIELD[dataType].default;
    const { name, title } = Parser.nameAndTitle(key);

    let children = {};
    if (dataType === DataType.OBJECT || dataType === DataType.ARRAY) {
      if (options.currSchema?.__root__) {
        const currSchema = options.currSchema.__root__.children;

        // TODO: Would this cause mutation?
        options.currSchema = currSchema;
      }

      children = Parser.convertObjectToSchema(options);
    }

    return {
      config: {
        props: {
          label: title,
        },
      },
      dataType,
      name,
      title,
      fieldType,
      children,
    };
  };

  // TODO: Better name? and add eg
  static convertObjectToSchema = ({
    currFormData = {},
    currSchema = {},
    prevFormData = {},
  }: ObjectToSchemaProps): Schema => {
    const schema = cloneDeep(currSchema);

    const currObj = normalizeToObject(currFormData);
    const prevObj = normalizeToObject(prevFormData);

    const currObjKeys = Object.keys(currObj);
    const prevObjKeys = Object.keys(prevObj);

    const newKeys = difference(currObjKeys, prevObjKeys);
    const removedKeys = difference(prevObjKeys, currObjKeys);
    const modifiedKeys = difference(currObjKeys, newKeys.concat(removedKeys));
    newKeys.forEach((newKey) => {
      schema[newKey] = Parser.getSchemaObjectFor(newKey, currObj[newKey], {
        currFormData: currObj[newKey],
      });
    });

    removedKeys.forEach((removedKey) => {
      delete schema[removedKey];
    });

    modifiedKeys.forEach((modifiedKey) => {
      const prevValue = currObj[modifiedKey];
      const currValue = currObj[modifiedKey];

      if (typeof currValue !== typeof prevValue) {
        schema[modifiedKey] = Parser.getSchemaObjectFor(
          modifiedKey,
          currObj[modifiedKey],
          {
            currFormData: currObj[modifiedKey],
            prevFormData: prevObj[modifiedKey],
            currSchema: schema[modifiedKey]?.children,
          },
        );
      }
    });

    return schema;
  };
}

export default Parser;
