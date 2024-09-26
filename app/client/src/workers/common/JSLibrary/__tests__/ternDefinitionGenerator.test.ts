import { makeTernDefs } from "../ternDefinitionGenerator";

describe("Tests tern definition generator", () => {
  const obj = {
    var1: "myVar1",
    var2: 2,
    var3: true,
    var4: null,
    var5: undefined,
    var6: { a: 1, b: 2 },
    var7: () => {
      return "there!";
    },
    var8: function () {
      return "hey, ";
    },
    var9: new Date(),
  };
  const proto = {
    sayHello() {
      return "Hello";
    },
  };

  it("Correctly determines tern def types based", () => {
    const expected = {
      var1: { "!type": "string" },
      var2: { "!type": "number" },
      var3: { "!type": "bool" },
      var4: { "!type": "?" },
      var5: { "!type": "?" },
      var6: { a: { "!type": "number" }, b: { "!type": "number" } },
      var7: { "!type": "fn()" },
    };
    const defs = makeTernDefs(obj);

    expect(defs).toMatchObject(expected);
  });
  it("should look up the prototype chain on objects", () => {
    Object.setPrototypeOf(obj, proto);
    const expected = {
      sayHello: { "!type": "fn()" },
    };
    const defs = makeTernDefs(proto);

    expect(defs).toMatchObject(expected);
  });
  it("should look up the prototype property on functions", () => {
    obj.var8.prototype = {
      sayWorld() {
        return "World";
      },
    };
    const expected = {
      var8: {
        "!type": "fn()",
        prototype: {
          sayWorld: { "!type": "fn()" },
        },
      },
    };
    const defs = makeTernDefs(obj);

    expect(defs).toMatchObject(expected);
  });
});
