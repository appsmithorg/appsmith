import { substituteDynamicBindingWithValues } from "workers/evaluationSubstitution";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

describe("substituteDynamicBindingWithValues", () => {
  describe("template substitution", () => {
    it("substitutes strings values", () => {
      const binding = "Hello {{name}}";
      const subBindings = ["Hello ", "{{name}}"];
      const subValues = ["Hello ", "Tester"];
      const expected = "Hello Tester";
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.TEMPLATE,
      );

      expect(result).toBe(expected);
    });

    it("substitute number values", () => {
      const binding = "My age is {{age}}";
      const subBindings = ["My age is ", "{{age}}"];
      const subValues = ["My age is ", 16];
      const expected = "My age is 16";
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.TEMPLATE,
      );

      expect(result).toBe(expected);
    });

    it("substitute objects/ arrays values", () => {
      const binding = "Response was {{response}}";
      const subBindings = ["Response was ", "{{response}}"];
      const subValues = ["Response was ", { message: "Unauthorised user" }];
      const expected = 'Response was {\\"message\\":\\"Unauthorised user\\"}';
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.TEMPLATE,
      );

      expect(result).toBe(expected);
    });

    it("substitute multiple values values", () => {
      const binding =
        "My name is {{name}}. My age is {{age}}. Response: {{response}}";
      const subBindings = [
        "My name is ",
        "{{name}}",
        ". My age is ",
        "{{age}}",
        ". Response: ",
        "{{response}}",
      ];
      const subValues = [
        "My name is ",
        "Tester",
        ". My age is ",
        16,
        ". Response: ",
        { message: "Unauthorised user" },
      ];
      const expected =
        'My name is Tester. My age is 16. Response: {\\"message\\":\\"Unauthorised user\\"}';
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.TEMPLATE,
      );

      expect(result).toBe(expected);
    });
  });
  describe("parameter substitution", () => {
    it("replaces bindings with $variables", () => {
      const binding = "SELECT * from {{tableName}} LIMIT {{limit}}";
      const subBindings = [
        "SELECT * from ",
        "{{tableName}}",
        " LIMIT ",
        "{{limit}}",
      ];
      const subValues = ["SELECT * from ", "users", " LIMIT ", 10];
      const expected = {
        value: "SELECT * from $1 LIMIT $2",
        parameters: {
          $1: "users",
          $2: 10,
        },
      };
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.PARAMETER,
      );

      expect(result).toHaveProperty("value");
      // @ts-expect-error: Types are not available
      expect(result.value).toBe(expected.value);
      // @ts-expect-error: Types are not available
      expect(result.parameters).toStrictEqual(expected.parameters);
    });

    it("removed quotes around bindings", () => {
      const binding =
        'SELECT * from users WHERE lastname = "{{lastname}}" LIMIT {{limit}}';
      const subBindings = [
        'SELECT * from users WHERE lastname = "',
        "{{lastname}}",
        '" LIMIT ',
        "{{limit}}",
      ];
      const subValues = [
        'SELECT * from users WHERE lastname = "',
        "Smith",
        '" LIMIT ',
        10,
      ];
      const expected = {
        value: "SELECT * from users WHERE lastname = $1 LIMIT $2",
        parameters: {
          $1: "Smith",
          $2: 10,
        },
      };
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.PARAMETER,
      );

      expect(result).toHaveProperty("value");
      // @ts-expect-error: Types are not available
      expect(result.value).toBe(expected.value);
      // @ts-expect-error: Types are not available
      expect(result.parameters).toStrictEqual(expected.parameters);
    });

    it("stringifies objects and arrays", () => {
      const binding = "SELECT * from {{testObject}} WHERE {{testArray}}";
      const subBindings = [
        "SELECT * from ",
        "{{testObject}}",
        " WHERE ",
        "{{testArray}}",
      ];
      const subValues = [
        "SELECT * from ",
        { name: "tester" },
        " WHERE ",
        [42, "meaning", false],
      ];
      const expected = {
        value: "SELECT * from $1 WHERE $2",
        parameters: {
          $1: `{\n  \"name\": \"tester\"\n}`,
          $2: `[\n  42,\n  \"meaning\",\n  false\n]`,
        },
      };
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.PARAMETER,
      );

      expect(result).toHaveProperty("value");
      // @ts-expect-error: Types are not available
      expect(result.value).toBe(expected.value);
      // @ts-expect-error: Types are not available
      expect(result.parameters).toStrictEqual(expected.parameters);
    });
  });
  describe("smart substitution", () => {
    it("substitutes strings, numbers, boolean, undefined, null values correctly", () => {
      const binding = `{
        "name": {{name}},
        "age": {{age}},
        "isHuman": {{isHuman}},
        "wrongBinding": {{wrongBinding}},
        "emptyBinding": {{emptyBinding}},
      }`;
      const subBindings = [
        '{\n        "name": ',
        "{{name}}",
        ',\n        "age": ',
        "{{age}}",
        ',\n        "isHuman": ',
        "{{isHuman}}",
        ',\n        "wrongBinding": ',
        "{{wrongBinding}}",
        ',\n        "emptyBinding": ',
        "{{emptyBinding}}",
        ",\n      }",
      ];
      const subValues = [
        '{\n        "name": ',
        "Tester",
        ',\n        "age": ',
        42,
        ',\n        "isHuman": ',
        false,
        ',\n        "wrongBinding": ',
        undefined,
        ',\n        "emptyBinding": ',
        null,
        ",\n      }",
      ];
      const expected = `{
        "name": "Tester",
        "age": 42,
        "isHuman": false,
        "wrongBinding": undefined,
        "emptyBinding": null,
      }`;
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.SMART_SUBSTITUTE,
      );

      expect(result).toBe(expected);
    });

    it("substitute objects/ arrays values", () => {
      const binding = `{\n  "data": {{formData}}\n}`;
      const subBindings = ["{\n  data: ", "{{formData}}", "\n}"];
      const subValues = [
        '{\n  "data": ',
        {
          name: "Tester",
          age: 42,
          isHuman: false,
          wrongBinding: undefined,
          emptyBinding: null,
        },
        "\n}",
      ];
      const expected =
        '{\n  "data": {\n  "name": "Tester",\n  "age": 42,\n  "isHuman": false,\n  "emptyBinding": null\n}\n}';
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.SMART_SUBSTITUTE,
      );

      expect(result).toBe(expected);
    });

    it("substitute correctly when quotes are surrounding the binding", () => {
      const binding = `{
        "name": "{{name}}",
        "age": "{{age}}",
        isHuman: {{isHuman}},
        "wrongBinding": {{wrongBinding}},
        "emptyBinding": "{{emptyBinding}}",
      }`;
      const subBindings = [
        '{\n        "name": "',
        "{{name}}",
        '",\n        "age": "',
        "{{age}}",
        '",\n        isHuman: ',
        "{{isHuman}}",
        ',\n        "wrongBinding": ',
        "{{wrongBinding}}",
        ',\n        "emptyBinding": "',
        "{{emptyBinding}}",
        '",\n      }',
      ];
      const subValues = [
        '{\n        "name": "',
        "Tester",
        '",\n        "age": "',
        42,
        '",\n        isHuman: ',
        false,
        ',\n        "wrongBinding": ',
        undefined,
        ',\n        "emptyBinding": "',
        null,
        '",\n      }',
      ];
      const expected = `{
        "name": "Tester",
        "age": 42,
        isHuman: false,
        "wrongBinding": undefined,
        "emptyBinding": null,
      }`;
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.SMART_SUBSTITUTE,
      );

      expect(result).toBe(expected);
    });

    it("escapes strings before substitution", () => {
      const binding = `{\n  "paragraph": {{paragraph}},\n}`;
      const subBindings = ['{\n  "paragraph": ', "{{paragraph}}", ",\n}"];
      const subValues = [
        '{\n  "paragraph": ',
        `This is a \f string \b with \n many different " characters that are not \n all. these \r\t`,
        ",\n}",
      ];
      const expected = `{\n  "paragraph": "This is a \\f string \\b with \\n many different \\" characters that are not \\n all. these \\r\\t",\n}`;
      const result = substituteDynamicBindingWithValues(
        binding,
        subBindings,
        subValues,
        EvaluationSubstitutionType.SMART_SUBSTITUTE,
      );

      expect(result).toBe(expected);
    });

    it("throws error when only binding is provided in parameter substitution", () => {
      const binding = `{{ appsmith }}`;
      const subBindings = ["{{appsmith}}"];
      const subValues = [{ test: "object" }];
      expect(() =>
        substituteDynamicBindingWithValues(
          binding,
          subBindings,
          subValues,
          EvaluationSubstitutionType.PARAMETER,
        ),
      ).toThrowError();
    });
  });
});
