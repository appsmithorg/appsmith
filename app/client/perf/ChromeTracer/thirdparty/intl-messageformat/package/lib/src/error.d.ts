export declare enum ErrorCode {
    MISSING_VALUE = "MISSING_VALUE",
    INVALID_VALUE = "INVALID_VALUE",
    MISSING_INTL_API = "MISSING_INTL_API"
}
export declare class FormatError extends Error {
    readonly code: ErrorCode;
    /**
     * Original message we're trying to format
     * `undefined` if we're only dealing w/ AST
     *
     * @type {(string | undefined)}
     * @memberof FormatError
     */
    readonly originalMessage: string | undefined;
    constructor(msg: string, code: ErrorCode, originalMessage?: string);
    toString(): string;
}
export declare class InvalidValueError extends FormatError {
    constructor(variableId: string, value: any, options: string[], originalMessage?: string);
}
export declare class InvalidValueTypeError extends FormatError {
    constructor(value: any, type: string, originalMessage?: string);
}
export declare class MissingValueError extends FormatError {
    constructor(variableId: string, originalMessage?: string);
}
//# sourceMappingURL=error.d.ts.map