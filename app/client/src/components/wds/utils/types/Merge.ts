/**
 * Given two object types A and B, return a type with all the properties of A that aren't also
 * properties of B, and all the properties of B.
 *
 * Useful when we have a component that spreads a "rest" of its props on a subcomponent:
 *
 * ```ts
 * interface OwnProps {
 *  foo: string
 * }
 *
 * type MyComponentProps = Merge<SubcomponentProps, OwnProps>
 * const MyComponent = ({foo, ...rest}: MyComponentProps) => {
 *   // ...
 *   return <SubComponent {...rest} />
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Merge<A = {}, B = {}> = Omit<A, keyof B> & B;
