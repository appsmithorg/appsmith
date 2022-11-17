jest.mock("sagas/ActionExecution/NavigateActionSaga", () => ({
  __esModule: true,
  default: "",
  NavigationTargetType: { SAME_WINDOW: "" },
}));

import {
  argsStringToArray,
  enumTypeSetter,
  enumTypeGetter,
  JSToString,
  modalGetter,
  modalSetter,
  stringToJS,
  textGetter,
  textSetter,
  isValueValidURL,
} from "./utils";

describe("Test argStringToArray", () => {
  const cases = [
    { index: 0, input: "", expected: [""] },
    { index: 1, input: "'a'", expected: ["'a'"] },
    { index: 2, input: "a", expected: ["a"] },
    { index: 3, input: "'a,b,c'", expected: ["'a,b,c'"] },
    { index: 4, input: "a,b,c", expected: ["a", "b", "c"] },
    { index: 5, input: "a, b, c", expected: ["a", " b", " c"] },
    { index: 6, input: "a , b , c", expected: ["a ", " b ", " c"] },
    { index: 7, input: "[a,b,c]", expected: ["[a,b,c]"] },
    { index: 8, input: "[a, b, c]", expected: ["[a, b, c]"] },
    {
      index: 9,
      input: "[\n\ta,\n\tb,\n\tc\n]",
      expected: ["[\n\ta,\n\tb,\n\tc\n]"],
    },
    { index: 10, input: "{a:1,b:2,c:3}", expected: ["{a:1,b:2,c:3}"] },
    {
      index: 11,
      input: '{"a":1,"b":2,"c":3}',
      expected: ['{"a":1,"b":2,"c":3}'],
    },
    {
      index: 12,
      input: "{\n\ta:1,\n\tb:2,\n\tc:3}",
      expected: ["{\n\ta:1,\n\tb:2,\n\tc:3}"],
    },
    {
      index: 13,
      input: "()=>{}",
      expected: ["()=>{}"],
    },
    {
      index: 14,
      input: "(a, b)=>{return a+b}",
      expected: ["(a, b)=>{return a+b}"],
    },
    {
      index: 15,
      input: "(a, b)=>{\n\treturn a+b;\n\t}",
      expected: ["(a, b)=>{\n\treturn a+b;\n\t}"],
    },
    {
      index: 16,
      input: "(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}",
      expected: ["(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}"],
    },
    {
      index: 17,
      input: `() => {return 5}`,
      expected: ["() => {return 5}"],
    },
    {
      index: 19,
      input: `(a) => {return a + 1}`,
      expected: ["(a) => {return a + 1}"],
    },
    {
      index: 19,
      input: `(a, b) => {return a + b}`,
      expected: ["(a, b) => {return a + b}"],
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = argsStringToArray(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test stringToJS", () => {
  const cases = [
    { index: 1, input: "{{'a'}}", expected: "'a'" },
    { index: 2, input: "{{a}}", expected: "a" },
    { index: 3, input: "{{'a,b,c'}}", expected: "'a,b,c'" },
    { index: 4, input: "{{a,b,c}}", expected: "a,b,c" },
    { index: 5, input: "{{a, b, c}}", expected: "a, b, c" },
    { index: 6, input: "{{a , b , c}}", expected: "a , b , c" },
    { index: 7, input: "{{[a,b,c]}}", expected: "[a,b,c]" },
    { index: 8, input: "{{[a, b, c]}}", expected: "[a, b, c]" },
    {
      index: 9,
      input: "{{[\n\ta,\n\tb,\n\tc\n]}}",
      expected: "[\n\ta,\n\tb,\n\tc\n]",
    },
    { index: 10, input: "{{{a:1,b:2,c:3}}}", expected: "{a:1,b:2,c:3}" },
    {
      index: 11,
      input: '{{{"a":1,"b":2,"c":3}}}',
      expected: '{"a":1,"b":2,"c":3}',
    },
    {
      index: 12,
      input: "{{{\n\ta:1,\n\tb:2,\n\tc:3}}}",
      expected: "{\n\ta:1,\n\tb:2,\n\tc:3}",
    },
    {
      index: 13,
      input: "{{()=>{}}}",
      expected: "()=>{}",
    },
    {
      index: 14,
      input: "{{(a, b)=>{return a+b}}}",
      expected: "(a, b)=>{return a+b}",
    },
    {
      index: 15,
      input: "{{(a, b)=>{\n\treturn a+b;\n\t}}}",
      expected: "(a, b)=>{\n\treturn a+b;\n\t}",
    },
    {
      index: 16,
      input: "{{(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}}}",
      expected: "(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}",
    },
    {
      index: 17,
      input: "{{() => {return 5}}}",
      expected: "() => {return 5}",
    },
    {
      index: 18,
      input: "{{(a) => {return a + 1}}}",
      expected: "(a) => {return a + 1}",
    },
    {
      index: 19,
      input: "{{(a, b) => {return a + b}}}",
      expected: "(a, b) => {return a + b}",
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = stringToJS(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test JSToString", () => {
  const cases = [
    { index: 1, input: "'a'", expected: "a" },
    { index: 2, input: "a", expected: "{{a}}" },
    { index: 3, input: "'a,b,c'", expected: "a,b,c" },
    { index: 4, input: "a,b,c", expected: "{{a,b,c}}" },
    { index: 5, input: "a, b, c", expected: "{{a, b, c}}" },
    { index: 6, input: "a , b , c", expected: "{{a , b , c}}" },
    { index: 7, input: "[a,b,c]", expected: "{{[a,b,c]}}" },
    { index: 8, input: "[a, b, c]", expected: "{{[a, b, c]}}" },
    {
      index: 9,
      input: "[\n\ta,\n\tb,\n\tc\n]",
      expected: "{{[\n\ta,\n\tb,\n\tc\n]}}",
    },
    { index: 10, input: "{a:1,b:2,c:3}", expected: "{{{a:1,b:2,c:3}}}" },
    {
      index: 11,
      input: '{"a":1,"b":2,"c":3}',
      expected: '{{{"a":1,"b":2,"c":3}}}',
    },
    {
      index: 12,
      input: "{\n\ta:1,\n\tb:2,\n\tc:3}",
      expected: "{{{\n\ta:1,\n\tb:2,\n\tc:3}}}",
    },
    {
      index: 13,
      input: "()=>{}",
      expected: "{{()=>{}}}",
    },
    {
      index: 14,
      input: "(a, b)=>{return a+b}",
      expected: "{{(a, b)=>{return a+b}}}",
    },
    {
      index: 15,
      input: "(a, b)=>{\n\treturn a+b;\n\t}",
      expected: "{{(a, b)=>{\n\treturn a+b;\n\t}}}",
    },
    {
      index: 16,
      input: "(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}",
      expected: "{{(\n\ta,\n\tb\n)=>{\n\treturn a+b;\n\t}}}",
    },
    {
      index: 17,
      input: "() => {return 5}",
      expected: "{{() => {return 5}}}",
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = JSToString(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test modalSetter", () => {
  const result = modalSetter("Modal1", "{{closeModal()}}");
  expect(result).toStrictEqual("{{closeModal('Modal1');}}");
});

describe("Test modalGetter", () => {
  const result = modalGetter("{{showModal('Modal1')}}");
  expect(result).toStrictEqual("Modal1");
});

describe("Test textSetter", () => {
  const result = textSetter(
    "google.com",
    "{{navigateTo('', {}, NEW_WINDOW)}}",
    0,
  );
  expect(result).toStrictEqual("{{navigateTo('google.com', {}, NEW_WINDOW);}}");
});

describe("Test textGetter", () => {
  const cases = [
    {
      index: 0,
      input: "{{navigateTo('google.com', {}, NEW_WINDOW)}}",
      expected: "google.com",
    },
    {
      index: 1,
      input: "{{navigateTo('google.com', {}, NEW_WINDOW)}}",
      expected: "{{{}}}",
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (index, input, expected) => {
      const result = textGetter(input as string, index as number);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test enumTypeSetter", () => {
  const cases = [
    {
      index: 0,
      value: "'info'",
      input: "{{showAlert('hi')}}",
      expected: "{{showAlert('hi', 'info');}}",
      argNum: 1,
    },
    {
      index: 1,
      value: "'info'",
      input: "{{showAlert('hi','error')}}",
      expected: "{{showAlert('hi', 'info');}}",
      argNum: 1,
    },
    {
      index: 2,
      value: "'info'",
      input: "{{showAlert('','')}}",
      expected: "{{showAlert('', 'info');}}",
      argNum: 1,
    },
    {
      index: 3,
      value: "'NEW_WINDOW'",
      input: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      expected: "{{navigateTo('', {}, 'NEW_WINDOW');}}",
      argNum: 2,
    },
    {
      index: 4,
      value: "'SAME_WINDOW'",
      input: "{{navigateTo('', {}, 'NEW_WINDOW')}}",
      expected: "{{navigateTo('', {}, 'SAME_WINDOW');}}",
      argNum: 2,
    },
  ];
  test.each(
    cases.map((x) => [x.index, x.input, x.expected, x.value, x.argNum]),
  )("test case %d", (index, input, expected, value, argNum) => {
    const result = enumTypeSetter(
      value as string,
      input as string,
      argNum as number,
    );
    expect(result).toStrictEqual(expected);
  });
});

describe("Test enumTypeGetter", () => {
  const cases = [
    {
      index: 0,
      value: "success",
      input: "{{showAlert('hi','info')}}",
      expected: "{{showAlert('hi','info')}}",
      argNum: 1,
    },
    {
      index: 1,
      value: "info",
      input: "{{showAlert(,'error')}}",
      expected: "{{showAlert(,'error')}}",
      argNum: 1,
    },
    {
      index: 2,
      value: "info",
      input: "{{showAlert()}}",
      expected: "{{showAlert()}}",
      argNum: 1,
    },
  ];
  test.each(
    cases.map((x) => [x.index, x.input, x.expected, x.value, x.argNum]),
  )("test case %d", (index, input, expected, value, argNum) => {
    const result = enumTypeGetter(
      value as string,
      argNum as number,
      input as string,
    );
    expect(result).toStrictEqual(expected);
  });
});

describe("Test isValueValidURL", () => {
  const cases = [
    {
      index: 1,
      input: "{{navigateTo('google.com', {}, 'SAME_WINDOW')}}",
      expected: true,
    },
    {
      index: 2,
      input: "{{navigateTo('www.google.com', {}, 'SAME_WINDOW')}}",
      expected: true,
    },
    {
      index: 3,
      input: "{{navigateTo('https://google.com', {}, 'NEW_WINDOW')}}",
      expected: true,
    },
    {
      index: 4,
      input: "{{navigateTo('http://localhost.com', {}, 'NEW_WINDOW')}}",
      expected: true,
    },
    {
      index: 5,
      input: "{{navigateTo('mailTo:a@example.com', {}, 'NEW_WINDOW')}}",
      expected: true,
    },
    {
      index: 6,
      input: "{{navigateTo('1234', {}, 'NEW_WINDOW')}}",
      expected: false,
    },
    {
      index: 7,
      input: "{{navigateTo('hi', {}, 'NEW_WINDOW')}}",
      expected: false,
    },
    {
      index: 8,
      input: "{{navigateTo('[]', {}, 'NEW_WINDOW')}}",
      expected: false,
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = isValueValidURL(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});
