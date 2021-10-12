import { camelCase, cloneDeep, difference, startCase } from "lodash";
import {
  DATA_TYPE_POTENTIAL_FIELD,
  DataType,
  Schema,
  SchemaObject,
  FieldType,
} from "./constants";

type Obj = Record<string, any>;
type JSON = Obj | Obj[];

// TODO: CHANGE SchemaObject to SchemaItem to avoid confusion

// TODO: CHANGE NAME
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

export const dataTypeFor = (value: any) => {
  const typeOfValue = typeof value;
  if (Array.isArray(value)) return DataType.ARRAY;

  return typeOfValue as DataType;
};

export const subDataTypeFor = (value: any) => {
  const dataType = dataTypeFor(value);

  if (dataType === DataType.ARRAY) {
    return dataTypeFor(value[0]);
  }

  return undefined;
};

export const normalizeArrayValue = (data: Obj[]) => {
  if (subDataTypeFor(data) === DataType.OBJECT) {
    return constructPlausibleObjectFromArray(data);
  }

  return data[0];
};

export const fieldTypeFor = (value: any) => {
  const dataType = dataTypeFor(value);
  const fieldType = DATA_TYPE_POTENTIAL_FIELD[dataType].default;
  const subDataType = subDataTypeFor(value);

  if (subDataType) {
    switch (subDataType) {
      case DataType.STRING:
      case DataType.NUMBER:
        return FieldType.MULTI_SELECT;
      default:
        return FieldType.ARRAY;
    }
  }

  return fieldType;
};

class Parser {
  static nameAndTitle = (key: string) => {
    return {
      name: camelCase(key),
      title: startCase(key),
    };
  };

  // TODO: add eg
  static getSchemaObjectFor = (
    key: string,
    value: any,
    passedOptions: ObjectToSchemaProps = {},
  ): SchemaObject => {
    const dataType = dataTypeFor(value);
    const fieldType = fieldTypeFor(value);

    const { name, title } = Parser.nameAndTitle(key);
    const props = {
      label: title,
    };
    // const children = computeChildren(value, options);
    let children = {};
    if (dataType === DataType.OBJECT) {
      children = Parser.convertObjectToSchema(passedOptions);
    }

    if (dataType === DataType.ARRAY) {
      children = Parser.convertArrayToSchema(passedOptions);
    }

    return {
      config: {
        props,
      },
      dataType,
      name,
      title,
      fieldType,
      children,
    };
  };

  static getModifiedSchemaObjectFor = (
    currData: JSON,
    prevData: JSON,
    schemaObject: SchemaObject,
  ) => {
    let { children } = schemaObject;
    const { dataType } = schemaObject;

    const options = {
      currFormData: currData,
      prevFormData: prevData,
      currSchema: children,
    };

    if (dataType === DataType.OBJECT) {
      children = Parser.convertObjectToSchema(options);
    }

    if (dataType === DataType.ARRAY) {
      children = Parser.convertArrayToSchema(options);
    }

    return {
      ...schemaObject,
      children,
    };
  };

  static convertArrayToSchema = ({
    currFormData = [],
    currSchema = {},
    prevFormData = [],
  }: ObjectToSchemaProps): Schema => {
    const schema = cloneDeep(currSchema);

    // TODO: FIX "as any"
    const currData = normalizeArrayValue(currFormData as any[]);
    const prevData = normalizeArrayValue(prevFormData as any[]);

    // think of a way to detect any change in the type of subtype? NO! only itself?
    // if already schema is present?

    // If the type has changed the generate the whole thing
    if (typeof currData !== typeof prevData) {
      schema.__array_item__ = Parser.getSchemaObjectFor("", currData, {
        currFormData: currData,
      });
    } else {
      schema.__array_item__ = Parser.getModifiedSchemaObjectFor(
        currData,
        prevData,
        schema.__array_item__,
      );
    }

    // How to detect updates?

    // I am responsible for myself only
    // So what should I do
    // Check my type
    // getOldSchemaObjectFor(currData, prevData, schema.__array_item__) <- This will take schemaObject
    // the above method would return the schemaObject as is but will call the respective convertObjectToSchema/convertArrayToSchema
    // based on the schemaObject dataType on the children key
    // Think about if the value structure has changed, how to proceed

    return schema;
  };

  static convertObjectToSchema = ({
    currFormData = {},
    currSchema = {},
    prevFormData = {},
  }: ObjectToSchemaProps): Schema => {
    const schema = cloneDeep(currSchema);
    const currObj = currFormData as Obj;
    const prevObj = prevFormData as Obj;

    const currObjKeys = Object.keys(currFormData);
    const prevObjKeys = Object.keys(prevFormData);

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
      const prevValue = prevObj[modifiedKey];
      const currValue = currObj[modifiedKey];

      // TODO: Fix nested object update, modified objects type would
      // be same so the following block won't run.
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
        // TODO: CHECK FOR PRIMITIVE DATA TYPE
      } else {
        schema[modifiedKey] = Parser.getModifiedSchemaObjectFor(
          currObj[modifiedKey],
          prevObj[modifiedKey],
          currSchema[modifiedKey],
        );
      }

      // if primitive check for type equality
      // if non primitive and type changed, create new
      // if non primitive and type remains same
      //
      // if __array_item__ present
      // if the level's data type does not change, do not modify anything from the
      // schema
      //
      //
      //
      //
    });

    return schema;
  };

  // handleArray
  // handleObject

  // TODO: add eg
  // IT's role is to run through they keys of an object,
  // observe changes and assign appropriate SchemaObject to it
  // static convertObjectToSchema = ({
  //   currFormData = {},
  //   currSchema = {},
  //   prevFormData = {},
  // }: ObjectToSchemaProps): Schema => {
  //   const schema = cloneDeep(currSchema);

  //   /**
  //    * for { education: ["asd"]}
  //    * call getSchemaObject from education - it will return all the array related stuff, dataType (Think about multi-select, compute children normally and set fieldType as MultiSelect)
  //    * it will call children with ["asd"] (convertArrayToSchema)
  //    *
  //    * As the value is a direct array
  //    */
  //   //
  //   // is the value array
  //   // if array (different direction)
  //   // if array item primitive, then add __array_item__ to schema, get SchemaObject for the primitive value
  //   // if non-primitive, then add __array_item__ to schema, get SchemaObject for the non primitive value?
  //   // if object (different direction)

  //   const currObj = normalizeToObject(currFormData);
  //   const prevObj = normalizeToObject(prevFormData);

  //   const currObjKeys = Object.keys(currObj);
  //   const prevObjKeys = Object.keys(prevObj);

  //   const newKeys = difference(currObjKeys, prevObjKeys);
  //   const removedKeys = difference(prevObjKeys, currObjKeys);
  //   const modifiedKeys = difference(currObjKeys, newKeys.concat(removedKeys));
  //   newKeys.forEach((newKey) => {
  //     schema[newKey] = Parser.getSchemaObjectFor(newKey, currObj[newKey], {
  //       currFormData: currObj[newKey],
  //     });
  //   });

  //   removedKeys.forEach((removedKey) => {
  //     delete schema[removedKey];
  //   });

  //   modifiedKeys.forEach((modifiedKey) => {
  //     const prevValue = currObj[modifiedKey];
  //     const currValue = currObj[modifiedKey];

  //     // TODO: Fix nested object update, modified objects type would
  //     // be same so the following block won't run.
  //     if (typeof currValue !== typeof prevValue) {
  //       schema[modifiedKey] = Parser.getSchemaObjectFor(
  //         modifiedKey,
  //         currObj[modifiedKey],
  //         {
  //           currFormData: currObj[modifiedKey],
  //           prevFormData: prevObj[modifiedKey],
  //           currSchema: schema[modifiedKey]?.children,
  //         },
  //       );
  //     }

  //     // if primitive check for type equality
  //     // if non primitive and type changed, create new
  //     // if non primitive and type remains same
  //     //
  //     // if __array_item__ present
  //     // if the level's data type does not change, do not modify anything from the
  //     // schema
  //     //
  //     //
  //     //
  //     //
  //   });

  //   return schema;
  // };
}

export default Parser;
