/**
 * @jest-environment jsdom
 */

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
import {
  enhanceRequestPayloadWithEventData,
  cleanValuesInObjectForHashing,
  generateHashFromString,
} from "sagas/helper";

describe("tests the redux saga helper functions", () => {
  it("tests the enhanceRequestPayloadWithEventData function", () => {
    const inputs = [
      { payload: { id: "xyz" }, type: "COPY_ACTION_INIT" },
      { payload: { id: "xyz" }, type: "DUMMY_ACTION" },
      {
        payload: {
          id: "xyz",
          eventData: { analyticsData: { originalActionId: "abc" } },
        },
        type: "COPY_ACTION_INIT",
      },
      { payload: {}, type: "COPY_ACTION_INIT" },
      { payload: {}, type: "" },
      { payload: undefined, type: "" },
    ];

    const outputs = [
      { id: "xyz", eventData: { analyticsData: { originalActionId: "xyz" } } },
      { id: "xyz" },
      { id: "xyz", eventData: { analyticsData: { originalActionId: "abc" } } },
      {},
      {},
      undefined,
    ];

    inputs.forEach((input, index) => {
      expect(
        enhanceRequestPayloadWithEventData(input.payload, input.type),
      ).toStrictEqual(outputs[index]);
    });
  });
  it("tests the cleanValuesInObjectForHashing function", () => {
    const inputs = [
      {
        body: 'UPDATE public.users SET "id"= \'{{Table2.updatedRow.id}}\', "gender"= \'{{Table2.updatedRow.gender}}\', "latitude"= \'{{Table2.updatedRow.latitude}}\', "longitude"= \'{{Table2.updatedRow.longitude}}\', "dob"= \'{{Table2.updatedRow.dob}}\', "phone"= \'{{Table2.updatedRow.phone}}\', "email"= \'{{Table2.updatedRow.email}}\', "image"= \'{{Table2.updatedRow.image}}\', "country"= \'{{Table2.updatedRow.country}}\', "name"= \'{{Table2.updatedRow.name}}\' WHERE "id"= {{Table2.updatedRow.id}};',
      },
      {
        paginationType: "NONE",
        encodeParamsToggle: true,
        body: 'UPDATE public.users SET "id"= \'{{Table2.updatedRow.id}}\', "gender"= \'{{Table2.updatedRow.gender}}\', "latitude"= \'{{Table2.updatedRow.latitude}}\', "longitude"= \'{{Table2.updatedRow.longitude}}\', "dob"= \'{{Table2.updatedRow.dob}}\', "phone"= \'{{Table2.updatedRow.phone}}\', "email"= \'{{Table2.updatedRow.email}}\', "image"= \'{{Table2.updatedRow.image}}\', "country"= \'{{Table2.updatedRow.country}}\', "name"= \'{{Table2.updatedRow.name}}\' WHERE "id"= {{Table2.updatedRow.id}};',
        selfReferencingDataPaths: [],
        pluginSpecifiedTemplates: [{ value: false }],
      },
      {
        paginationType: "NONE",
        encodeParamsToggle: true,
        selfReferencingDataPaths: [],
        formData: {
          aggregate: { limit: { data: "10" } },
          smartSubstitution: { data: true },
          insert: { documents: { data: "{{(Table3.newRow || {})}}" } },
          command: { data: "INSERT" },
          collection: { data: "movies" },
        },
      },
      {
        timeoutInMillisecond: 10000.0,
        paginationType: "NONE",
        encodeParamsToggle: true,
        selfReferencingDataPaths: [],
        formData: { pageSize: "100", command: "", sort: "" },
      },
      {
        body: 'UPDATE public.users SET "id"= \'{{Table2.updatedRow.id}}\', "gender"= \'{{Table2.updatedRow.gender}}\', "latitude"= \'{{Table2.updatedRow.latitude}}\', "longitude"= \'{{Table2.updatedRow.longitude}}\', "dob"= \'{{Table2.updatedRow.dob}}\', "phone"= \'{{Table2.updatedRow.phone}}\', "email"= \'{{Table2.updatedRow.email}}\', "image"= \'{{Table2.updatedRow.image}}\', "country"= \'{{Table2.updatedRow.country}}\', "name"= \'{{Table2.updatedRow.name}}\' WHERE "id"= {{Table2.updatedRow.id}}; \n -- I am an SQL comment',
      },
    ];

    const outputs = [
      {
        body: `updatepublic.usersset"id"='',"gender"='',"latitude"='',"longitude"='',"dob"='',"phone"='',"email"='',"image"='',"country"='',"name"=''where"id"=;`,
      },
      {
        paginationType: "none",
        encodeParamsToggle: true,
        body: `updatepublic.usersset"id"='',"gender"='',"latitude"='',"longitude"='',"dob"='',"phone"='',"email"='',"image"='',"country"='',"name"=''where"id"=;`,
        selfReferencingDataPaths: [],
        pluginSpecifiedTemplates: [{ value: false }],
      },
      {
        paginationType: "none",
        encodeParamsToggle: true,
        selfReferencingDataPaths: [],
        formData: {
          aggregate: { limit: { data: "10" } },
          smartSubstitution: { data: true },
          insert: { documents: { data: "" } },
          command: { data: "insert" },
          collection: { data: "movies" },
        },
      },
      {
        timeoutInMillisecond: 10000.0,
        paginationType: "none",
        encodeParamsToggle: true,
        selfReferencingDataPaths: [],
        formData: { pageSize: "100", command: "", sort: "" },
      },
      {
        body: `updatepublic.usersset"id"='',"gender"='',"latitude"='',"longitude"='',"dob"='',"phone"='',"email"='',"image"='',"country"='',"name"=''where"id"=;`,
      },
    ];

    inputs.forEach((input, index) => {
      expect(cleanValuesInObjectForHashing(input)).toStrictEqual(
        outputs[index],
      );
    });
  });
  it("tests the generateHashFromString function", async () => {
    // verify that the same strings generate the same SHA1
    const sameInputs = ["testString1", "testString1"];
    const output1 = await generateHashFromString(sameInputs[0]);
    const output2 = await generateHashFromString(sameInputs[1]);

    expect(output1).toEqual(output2);

    // verify that different strings generate different SHA1
    const differentInputs = ["testString1", "testString2"];
    const output3 = await generateHashFromString(differentInputs[0]);
    const output4 = await generateHashFromString(differentInputs[1]);

    expect(output3).not.toEqual(output4);

    // verify that the SHA1 is the same in the future
    // Note: There is something up with the algorithm, due to the it using
    // ByteArrays and converting to hex strings
    // If you google, the SHA1 for "testString", you get "956265657d0b637ef65b9b59f9f858eecf55ed6a"
    // Nevertheless, for our purposes, this is fine
    const testString = "testString";
    const sha1fortestString = "21b695cef037e9a8e0b3edccac3e5e58271edf22";
    const output = await generateHashFromString(testString);

    expect(output).toEqual(sha1fortestString);
  });
  it("tests the generateHashFromString function with a complex object", async () => {
    const input1 = {
      body: 'UPDATE public.users SET "id"= \'{{Table2.updatedRow.id}}\', "gender"= \'{{Table2.updatedRow.gender}}\', "latitude"= \'{{Table2.updatedRow.latitude}}\', "longitude"= \'{{Table2.updatedRow.longitude}}\', "dob"= \'{{Table2.updatedRow.dob}}\', "phone"= \'{{Table2.updatedRow.phone}}\', "email"= \'{{Table2.updatedRow.email}}\', "image"= \'{{Table2.updatedRow.image}}\', "country"= \'{{Table2.updatedRow.country}}\', "name"= \'{{Table2.updatedRow.name}}\' WHERE "id"= {{Table2.updatedRow.id}}; \n -- I am an SQL comment',
    };
    const input2 = {
      body: `UPDATE public.users SET "id"= \'{{Table2.updatedRow.id}}\', "gender"= \'{{Table2.updatedRow.gender}}\', "latitude"= \'{{Table2.updatedRow.latitude}}\', "longitude"= \'{{Table2.updatedRow.longitude}}\', "dob"= \'{{Table2.updatedRow.dob}}\', "phone"= \'{{Table2.updatedRow.phone}}\', "email"= \'{{Table2.updatedRow.email}}\', "image"= \'{{(() => { return "myvalue" })}}\', "country"= \'{{Table2.updatedRow.country}}\', "name"= \'{{GetQuery.updatedRow.name}}\' WHERE "id"= {{Table5.updatedRow.id}};`,
    };

    const cleanObjectInput1 = cleanValuesInObjectForHashing(input1);
    const cleanObjectInput2 = cleanValuesInObjectForHashing(input2);

    const hash1 = await generateHashFromString(
      JSON.stringify(cleanObjectInput1),
    );
    const hash2 = await generateHashFromString(
      JSON.stringify(cleanObjectInput2),
    );

    expect(hash1).toEqual(hash2);
  });
});
