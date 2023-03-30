import { EMPTY_BINDING_WITH_EMPTY_OBJECT } from "./constants";

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
  objectSetter,
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
    {
      index: 20,
      input: "{{Text1}}",
      expected: "Text1",
    },
    {
      index: 21,
      input: "Hello {{Text1}}",
      expected: "'Hello ' + Text1",
    },
    {
      index: 22,
      input: "Hello",
      expected: "'Hello'",
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
  const cases = [
    {
      index: 1,
      input: "{{showModal('')}}",
      expected: "{{showModal('Modal1');}}",
      value: "Modal1",
    },
    {
      index: 2,
      input: "{{showModal('Modal1')}}",
      expected: "{{showModal('Modal2');}}",
      value: "Modal2",
    },
    {
      index: 3,
      input: "{{closeModal('')}}",
      expected: "{{closeModal('Modal1');}}",
      value: "Modal1",
    },
    {
      index: 4,
      input: "{{closeModal('Modal1')}}",
      expected: "{{closeModal('Modal2');}}",
      value: "Modal2",
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected, x.value]))(
    "test case %d",
    (index, input, expected, value) => {
      const result = modalSetter(value as string, input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test modalGetter", () => {
  const cases = [
    {
      index: 1,
      input: "{{showModal('')}}",
      expected: "",
    },
    {
      index: 2,
      input: "{{showModal('Modal1')}}",
      expected: "Modal1",
    },
    {
      index: 3,
      input: "{{closeModal('')}}",
      expected: "",
    },
    {
      index: 4,
      input: "{{closeModal('Modal1')}}",
      expected: "Modal1",
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (index, input, expected) => {
      const result = modalGetter(input as string);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test textSetter", () => {
  const cases = [
    {
      index: 0,
      input: '{{navigateTo("", {}, NEW_WINDOW)}}',
      expected: "{{navigateTo('google.com', {}, NEW_WINDOW);}}",
      argNum: 0,
      value: "google.com",
    },
    {
      index: 1,
      input: '{{download("image", "", "")}}',
      expected: '{{download("image", \'img.png\', "");}}',
      argNum: 1,
      value: "img.png",
    },
    {
      index: 2,
      input: "{{showAlert(1, 'info')}}",
      expected: "{{showAlert(true, 'info');}}",
      argNum: 0,
      value: "{{true}}",
    },
    {
      index: 3,
      input: '{{showAlert("hi", "info")}}',
      expected: "{{showAlert('bye', \"info\");}}",
      argNum: 0,
      value: "bye",
    },
    {
      index: 4,
      input: '{{showAlert("hi", "")}}',
      expected: "{{showAlert('', \"\");}}",
      argNum: 0,
      value: "",
    },
    {
      index: 5,
      input: "{{showAlert('', '')}}",
      expected: "{{showAlert(1, '');}}",
      argNum: 0,
      value: "{{1}}",
    },
    {
      index: 6,
      input: "{{showAlert(true, '')}}",
      expected: "{{showAlert(appsmith.mode, '');}}",
      argNum: 0,
      value: "{{appsmith.mode}}",
    },
    {
      index: 7,
      input: "{{showAlert(appsmith.mode, '')}}",
      expected: "{{showAlert('', '');}}",
      argNum: 0,
      value: "",
    },
    {
      index: 8,
      input: "{{showAlert(JSobj1.myText, '')}}",
      expected: "{{showAlert(JSobj1.myText, '');}}",
      argNum: 0,
      value: "{{JSobj1.myText}}",
    },
    {
      index: 9,
      input: '{{showAlert("", "");}}',
      expected: '{{showAlert("r" + "p" + "rdpp", "");}}',
      argNum: 0,
      value: '{{"r" + "p" + "rdpp"}}',
    },
    {
      index: 10,
      input: '{{showAlert("", "");}}',
      expected: '{{showAlert(JSObject1.myVar1 + "dfd", "");}}',
      argNum: 0,
      value: '{{JSObject1.myVar1 + "dfd"}}',
    },
    {
      index: 11,
      input: '{{showAlert(true, "");}}',
      expected: '{{showAlert(() => {\n  return "hi";\n}, "");}}',
      argNum: 0,
      value: '{{() => {\n  return "hi";\n}}}',
    },
    {
      index: 12,
      input: "{{JSObject1.myFun1();}}",
      expected: "{{JSObject1.myFun1('Hello');}}",
      argNum: 0,
      value: "Hello",
    },
    {
      index: 13,
      input:
        '{{setInterval(() => {\n  // add code here\n  console.log("hello");\n}, 5000, "");}}',
      expected:
        "{{setInterval(() => {\n  // add code here\n  console.log(\"hello\");\n}, 5000, 'hello-id');}}",
      argNum: 2,
      value: "hello-id",
    },
  ];
  test.each(
    cases.map((x) => [x.index, x.input, x.expected, x.value, x.argNum]),
  )("test case %d", (index, input, expected, value, argNum) => {
    const result = textSetter(
      value as string,
      input as string,
      argNum as number,
    );
    expect(result).toStrictEqual(expected);
  });
});

describe("Test textGetter", () => {
  const cases = [
    {
      index: 0,
      input: "{{navigateTo('google.com', {}, NEW_WINDOW)}}",
      expected: "google.com",
      argNum: 0,
    },
    {
      index: 1,
      input: "{{navigateTo('google.com', {}, NEW_WINDOW)}}",
      expected: EMPTY_BINDING_WITH_EMPTY_OBJECT,
      argNum: 1,
    },
    {
      index: 2,
      input: "{{showAlert('', 'info')}}",
      expected: "",
      argNum: 0,
    },
    {
      index: 3,
      input: "{{showAlert('hi', 'info')}}",
      expected: "hi",
      argNum: 0,
    },
    {
      index: 4,
      input: "{{showAlert('hi', '')}}",
      expected: "hi",
      argNum: 0,
    },
    {
      index: 5,
      input: "{{showAlert(1, '')}}",
      expected: "{{1}}",
      argNum: 0,
    },
    {
      index: 6,
      input: "{{showAlert(true, '')}}",
      expected: "{{true}}",
      argNum: 0,
    },
    {
      index: 7,
      input: "{{showAlert(appsmith.mode, '')}}",
      expected: "{{appsmith.mode}}",
      argNum: 0,
    },
    {
      index: 8,
      input: "{{showAlert(JSobj1.myText, '')}}",
      expected: "{{JSobj1.myText}}",
      argNum: 0,
    },
    {
      index: 9,
      input: '{{showAlert("r" + "p" + "rdpp", "");}}',
      expected: '{{"r" + "p" + "rdpp"}}',
      argNum: 0,
    },
    {
      index: 10,
      input: '{{showAlert(JSObject1.myVar1 + "dfd", "");}}',
      expected: '{{JSObject1.myVar1 + "dfd"}}',
      argNum: 0,
    },
    {
      index: 11,
      input: '{{showAlert(() =>{return "hi"}, "");}}',
      expected: '{{() => {\n  return "hi";\n}}}',
      argNum: 0,
    },
    {
      index: 12,
      input: '{{storeValue("a", 1).then(showAlert("yo"))}}',
      expected: "a",
      argNum: 0,
    },
    {
      index: 13,
      input: '{{storeValue("a", 1).then(() => showAlert("yo"))}}',
      expected: "a",
      argNum: 0,
    },
    {
      index: 14,
      input: "{{navigateTo('Page1', {a:1}, 'SAME_WINDOW');}}",
      expected: "{{{\n  a: 1\n}}}",
      argNum: 1,
    },
    {
      index: 15,
      input: "{{navigateTo('Page1', {a:1, b:3}, 'SAME_WINDOW');}}",
      expected: "{{{\n  a: 1,\n  b: 3\n}}}",
      argNum: 1,
    },
    {
      index: 16,
      input: "{{navigateTo('Page1', {}, 'SAME_WINDOW');}}",
      expected: EMPTY_BINDING_WITH_EMPTY_OBJECT,
      argNum: 1,
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected, x.argNum]))(
    "test case %d",
    (index, input, expected, argNum) => {
      const result = textGetter(input as string, argNum as number);
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
      input: "{{showAlert('hi','info')}}",
      expected: "'info'",
      argNum: 1,
    },
    {
      index: 1,
      input: "{{showAlert('','error')}}",
      expected: "'error'",
      argNum: 1,
    },
    {
      index: 2,
      input: "{{navigateTo('Page1', {}, 'SAME_WINDOW');}}",
      expected: "'Page1'",
      argNum: 0,
    },
  ];
  test.each(cases.map((x) => [x.index, x.input, x.expected, x.argNum]))(
    "test case %d",
    (index, input, expected, argNum) => {
      const result = enumTypeGetter(input as string, argNum as number);
      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test objectSetter", () => {
  const cases = [
    {
      index: 0,
      value: "{{{a:1}}}",
      input: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      expected: "{{navigateTo('', {a:1}, 'SAME_WINDOW');}}",
      argNum: 1,
    },
    {
      index: 1,
      value: "{{{a:1, b:2}}}",
      input: "{{navigateTo('', {}, 'SAME_WINDOW')}}",
      expected: "{{navigateTo('', {a:1, b:2}, 'SAME_WINDOW');}}",
      argNum: 1,
    },
    {
      index: 2,
      value: "{{{a:1, b:2}}}",
      input: "{{navigateTo('', {c:6}, 'SAME_WINDOW')}}",
      expected: "{{navigateTo('', {a:1, b:2}, 'SAME_WINDOW');}}",
      argNum: 1,
    },
  ];
  test.each(
    cases.map((x) => [x.index, x.input, x.expected, x.value, x.argNum]),
  )("test case %d", (index, input, expected, value, argNum) => {
    const result = objectSetter(
      value as string,
      input as string,
      argNum as number,
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
