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
  sortSubMenuOptions,
} from "./utils";
import type { TreeDropdownOption } from "@appsmith/ads-old";

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
      const result = argsStringToArray(input);

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
      const result = stringToJS(input);

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
      const result = JSToString(input);

      expect(result).toStrictEqual(expected);
    },
  );
});

describe("Test modalSetter", () => {
  const cases = [
    {
      index: 1,
      input: "{{showModal('')}}",
      expected: "{{showModal(Modal1.name);}}",
      value: "Modal1.name",
    },
    {
      index: 2,
      input: "{{showModal(Modal1.name)}}",
      expected: "{{showModal(Modal2.name);}}",
      value: "Modal2.name",
    },
    {
      index: 3,
      input: "{{closeModal('')}}",
      expected: "{{closeModal(Modal1.name);}}",
      value: "Modal1.name",
    },
    {
      index: 4,
      input: "{{closeModal(Modal1.name)}}",
      expected: "{{closeModal(Modal2.name);}}",
      value: "Modal2.name",
    },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected, x.value]))(
    "test case %d",
    (index, input, expected, value) => {
      const result = modalSetter(value, input);

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
      input: "{{showModal(Modal1.name)}}",
      expected: "Modal1.name",
    },
    {
      index: 3,
      input: '{{showModal("Modal1")}}',
      expected: "Modal1",
    },
    {
      index: 4,
      input: "{{closeModal('')}}",
      expected: "",
    },
    {
      index: 5,
      input: "{{closeModal(Modal1.name)}}",
      expected: "Modal1.name",
    },
    {
      index: 6,
      input: '{{closeModal("Modal1")}}',
      expected: "Modal1",
    },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (index, input, expected) => {
      const result = modalGetter(input);

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
      value,
      input,
      argNum,
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
      const result = textGetter(input, argNum);

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
      value,
      input,
      argNum,
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
      const result = enumTypeGetter(input, argNum);

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
      value,
      input,
      argNum,
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
      const result = isValueValidURL(input);

      expect(result).toStrictEqual(expected);
    },
  );
});

describe("sortSubMenuOptions", () => {
  const cases = [
    {
      index: 0,
      input: [
        {
          label: "1",
          id: "6433b0017bd3732ec082375c",
          value: "'1'",
        },
        {
          id: "ndsf3edjw7",
          label: "adc",
          value: "adc",
        },
        {
          id: "a3bvr4ybt1",
          label: "fsfsdg",
          value: "fsfsdg",
        },
        {
          label: "Page1",
          id: "6398aba6b8c4dd68403825a3",
          value: "'Page1'",
        },
        {
          label: "12",
          id: "6433b0017bd3732ec082375csdsdsds",
          value: "'12'",
        },
        {
          label: "2",
          id: "6433b0017bd3732ec082375csdsdsdssdsds",
          value: "'2'",
        },
        {
          label: "Page10",
          id: "6426cd4646c8f921c25eb1b3",
          value: "'Page10'",
        },
        {
          label: "Page2",
          id: "6399a035b8c4dd684038282e",
          value: "'Page2'",
        },
      ],
      expected: [
        {
          label: "1",
          id: "6433b0017bd3732ec082375c",
          value: "'1'",
        },
        {
          label: "2",
          id: "6433b0017bd3732ec082375csdsdsdssdsds",
          value: "'2'",
        },
        {
          label: "12",
          id: "6433b0017bd3732ec082375csdsdsds",
          value: "'12'",
        },
        {
          id: "ndsf3edjw7",
          label: "adc",
          value: "adc",
        },
        {
          id: "a3bvr4ybt1",
          label: "fsfsdg",
          value: "fsfsdg",
        },
        {
          label: "Page1",
          id: "6398aba6b8c4dd68403825a3",
          value: "'Page1'",
        },
        {
          label: "Page2",
          id: "6399a035b8c4dd684038282e",
          value: "'Page2'",
        },
        {
          label: "Page10",
          id: "6426cd4646c8f921c25eb1b3",
          value: "'Page10'",
        },
      ],
    },
    {
      index: 1,
      input: [
        {
          label: "New window",
          value: "'NEW_WINDOW'",
          id: "NEW_WINDOW",
        },
        {
          label: "Same window",
          value: "'SAME_WINDOW'",
          id: "SAME_WINDOW",
        },
      ],
      expected: [
        {
          label: "New window",
          value: "'NEW_WINDOW'",
          id: "NEW_WINDOW",
        },
        {
          label: "Same window",
          value: "'SAME_WINDOW'",
          id: "SAME_WINDOW",
        },
      ],
    },
    {
      index: 2,
      input: [
        {
          label: "Error",
          value: "'error'",
          id: "error",
        },
        {
          label: "Info",
          value: "'info'",
          id: "info",
        },
        {
          label: "Success",
          value: "'success'",
          id: "success",
        },
        {
          label: "Warning",
          value: "'warning'",
          id: "warning",
        },
      ],
      expected: [
        {
          label: "Error",
          value: "'error'",
          id: "error",
        },
        {
          label: "Info",
          value: "'info'",
          id: "info",
        },
        {
          label: "Success",
          value: "'success'",
          id: "success",
        },
        {
          label: "Warning",
          value: "'warning'",
          id: "warning",
        },
      ],
    },
    {
      index: 3,
      input: [
        {
          label: "CSV",
          value: "'text/csv'",
          id: "text/csv",
        },
        {
          label: "Select file type (optional)",
          value: "",
          id: "",
        },
        {
          label: "HTML",
          value: "'text/html'",
          id: "text/html",
        },
        {
          label: "Plain text",
          value: "'text/plain'",
          id: "text/plain",
        },
        {
          label: "PNG",
          value: "'image/png'",
          id: "image/png",
        },
        {
          label: "JPEG",
          value: "'image/jpeg'",
          id: "image/jpeg",
        },
        {
          label: "SVG",
          value: "'image/svg+xml'",
          id: "image/svg+xml",
        },
        {
          label: "JSON",
          value: "'application/json'",
          id: "application/json",
        },
      ],
      expected: [
        {
          label: "Select file type (optional)",
          value: "",
          id: "",
        },
        {
          label: "CSV",
          value: "'text/csv'",
          id: "text/csv",
        },
        {
          label: "HTML",
          value: "'text/html'",
          id: "text/html",
        },
        {
          label: "JPEG",
          value: "'image/jpeg'",
          id: "image/jpeg",
        },
        {
          label: "JSON",
          value: "'application/json'",
          id: "application/json",
        },
        {
          label: "Plain text",
          value: "'text/plain'",
          id: "text/plain",
        },
        {
          label: "PNG",
          value: "'image/png'",
          id: "image/png",
        },
        {
          label: "SVG",
          value: "'image/svg+xml'",
          id: "image/svg+xml",
        },
      ],
    },
    {
      index: 4,
      input: [
        {
          id: "a3bvr4ybt1",
          label: "fsfsdg",
          value: "fsfsdg",
        },
        {
          label: "New Modal",
          value: "Modal",
          id: "create",
          icon: "plus",
          className: "t--create-modal-btn",
        },
        {
          id: "lz8id1xnk7",
          label: "Modal1",
          value: "Modal1",
        },
        {
          id: "j5gg12lloy",
          label: "Modal2",
          value: "Modal2",
        },
        {
          id: "ndsf3edjw7",
          label: "adc",
          value: "adc",
        },
        {
          id: "bfv7i1qt72",
          label: "Modal10",
          value: "Modal10",
        },
      ],
      expected: [
        {
          label: "New Modal",
          value: "Modal",
          id: "create",
          icon: "plus",
          className: "t--create-modal-btn",
        },
        {
          id: "ndsf3edjw7",
          label: "adc",
          value: "adc",
        },
        {
          id: "a3bvr4ybt1",
          label: "fsfsdg",
          value: "fsfsdg",
        },
        {
          id: "lz8id1xnk7",
          label: "Modal1",
          value: "Modal1",
        },
        {
          id: "j5gg12lloy",
          label: "Modal2",
          value: "Modal2",
        },
        {
          id: "bfv7i1qt72",
          label: "Modal10",
          value: "Modal10",
        },
      ],
    },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = sortSubMenuOptions(input as TreeDropdownOption[]);

      expect(result).toStrictEqual(expected);
    },
  );
});
