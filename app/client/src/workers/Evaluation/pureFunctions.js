const detect = require('acorn-globals');

a = {
    "key" : () => {
        // console.log("hello there")
        fetch
    }
}

isPureFn = (data) => {
    const keys = Object.keys(data);

    let isPure = true;

    for (const key of keys) {
        const value = data[key];
        if (typeof value !== "function") continue;
        const fnString = `const fn = ${value.toString()};`;
        const globals = detect(fnString);
        if (globals.length > 0) {
          isPure = false;
          console.log("found globals ", globals)
          break;
        //   parsed[key] = "() => {}";
        //   messages?.push({
        //     name: "ValidationError",
        //     message: `Function uses global variables: ${globals
        //       .map((g) => g.name)
        //       .join(", ")}`,
        //   });
        }
    }
    console.log("is pure ", isPure)
    return isPure
}


console.log(a)
isPureFn(a)