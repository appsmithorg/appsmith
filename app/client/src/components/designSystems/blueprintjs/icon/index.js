// See readme.md for why this file exists.

// NOTE: this file must be written in JavaScript. We replace @blueprintjs/core/lib/esm/components/icon/icon.js
// with this file, which means webpack assumes this file lives in node_modules and doesn’t
// pass it through babel-loader. That’s why, instead of using putting the implementation here,
// we re-export it from a separate file.
export * from "components/designSystems/blueprintjs/icon/Icon";
