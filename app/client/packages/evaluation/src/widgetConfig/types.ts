// Definition of the Constructor type. This type is used to
// define a constructor function that can be used to create new
// instances of a class.
// Ref: https://www.typescriptlang.org/docs/handbook/mixins.html#how-does-a-mixin-work

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => any;
