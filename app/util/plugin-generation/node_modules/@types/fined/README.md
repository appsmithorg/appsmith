# Installation
> `npm install --save @types/fined`

# Summary
This package contains type definitions for fined (https://github.com/gulpjs/fined).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/fined.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/fined/index.d.ts)
````ts
// Type definitions for fined 1.1
// Project: https://github.com/gulpjs/fined
// Definitions by: BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export = fined;

declare function fined(path: string | fined.PathSpec, opts?: fined.PathSpec): fined.Result | null;

declare namespace fined {
    interface PathSpec {
        path?: string | undefined;
        name?: string | undefined;
        extensions?: string | string[] | { [extension: string]: string | null } | undefined;
        cwd?: string | undefined;
        findUp?: boolean | undefined;
    }

    interface Result {
        path: string;
        extension: string | { [extension: string]: string };
    }
}

````

### Additional Details
 * Last updated: Tue, 06 Jul 2021 20:32:59 GMT
 * Dependencies: none
 * Global values: none

# Credits
These definitions were written by [BendingBender](https://github.com/BendingBender).
