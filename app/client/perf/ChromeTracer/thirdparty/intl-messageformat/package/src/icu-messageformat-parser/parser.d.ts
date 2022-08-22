// MIT License
//
// Copyright (c) 2021 FormatJS
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { ParserError } from './error';
import { MessageFormatElement } from './types';
export interface Position {
    /** Offset in terms of UTF-16 *code unit*. */
    offset: number;
    line: number;
    /** Column offset in terms of unicode *code point*. */
    column: number;
}
export interface ParserOptions {
    /**
     * Whether to treat HTML/XML tags as string literal
     * instead of parsing them as tag token.
     * When this is false we only allow simple tags without
     * any attributes
     */
    ignoreTag?: boolean;
    /**
     * Should `select`, `selectordinal`, and `plural` arguments always include
     * the `other` case clause.
     */
    requiresOtherClause?: boolean;
    /**
     * Whether to parse number/datetime skeleton
     * into Intl.NumberFormatOptions and Intl.DateTimeFormatOptions, respectively.
     */
    shouldParseSkeletons?: boolean;
    /**
     * Capture location info in AST
     * Default is false
     */
    captureLocation?: boolean;
}
export declare type Result<T, E> = {
    val: T;
    err: null;
} | {
    val: null;
    err: E;
};
export declare class Parser {
    private message;
    private position;
    private ignoreTag;
    private requiresOtherClause;
    private shouldParseSkeletons?;
    constructor(message: string, options?: ParserOptions);
    parse(): Result<MessageFormatElement[], ParserError>;
    private parseMessage;
    /**
     * A tag name must start with an ASCII lower/upper case letter. The grammar is based on the
     * [custom element name][] except that a dash is NOT always mandatory and uppercase letters
     * are accepted:
     *
     * ```
     * tag ::= "<" tagName (whitespace)* "/>" | "<" tagName (whitespace)* ">" message "</" tagName (whitespace)* ">"
     * tagName ::= [a-z] (PENChar)*
     * PENChar ::=
     *     "-" | "." | [0-9] | "_" | [a-z] | [A-Z] | #xB7 | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x37D] |
     *     [#x37F-#x1FFF] | [#x200C-#x200D] | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
     *     [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
     * ```
     *
     * [custom element name]: https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
     * NOTE: We're a bit more lax here since HTML technically does not allow uppercase HTML element but we do
     * since other tag-based engines like React allow it
     */
    private parseTag;
    /**
     * This method assumes that the caller has peeked ahead for the first tag character.
     */
    private parseTagName;
    private parseLiteral;
    tryParseLeftAngleBracket(): string | null;
    /**
     * Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
     * a character that requires quoting (that is, "only where needed"), and works the same in
     * nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
     */
    private tryParseQuote;
    private tryParseUnquoted;
    private parseArgument;
    /**
     * Advance the parser until the end of the identifier, if it is currently on
     * an identifier character. Return an empty string otherwise.
     */
    private parseIdentifierIfPossible;
    private parseArgumentOptions;
    private tryParseArgumentClose;
    /**
     * See: https://github.com/unicode-org/icu/blob/af7ed1f6d2298013dc303628438ec4abe1f16479/icu4c/source/common/messagepattern.cpp#L659
     */
    private parseSimpleArgStyleIfPossible;
    private parseNumberSkeletonFromString;
    /**
     * @param nesting_level The current nesting level of messages.
     *     This can be positive when parsing message fragment in select or plural argument options.
     * @param parent_arg_type The parent argument's type.
     * @param parsed_first_identifier If provided, this is the first identifier-like selector of
     *     the argument. It is a by-product of a previous parsing attempt.
     * @param expecting_close_tag If true, this message is directly or indirectly nested inside
     *     between a pair of opening and closing tags. The nested message will not parse beyond
     *     the closing tag boundary.
     */
    private tryParsePluralOrSelectOptions;
    private tryParseDecimalInteger;
    private offset;
    private isEOF;
    private clonePosition;
    /**
     * Return the code point at the current position of the parser.
     * Throws if the index is out of bound.
     */
    private char;
    private error;
    /** Bump the parser to the next UTF-16 code unit. */
    private bump;
    /**
     * If the substring starting at the current position of the parser has
     * the given prefix, then bump the parser to the character immediately
     * following the prefix and return true. Otherwise, don't bump the parser
     * and return false.
     */
    private bumpIf;
    /**
     * Bump the parser until the pattern character is found and return `true`.
     * Otherwise bump to the end of the file and return `false`.
     */
    private bumpUntil;
    /**
     * Bump the parser to the target offset.
     * If target offset is beyond the end of the input, bump the parser to the end of the input.
     */
    private bumpTo;
    /** advance the parser through all whitespace to the next non-whitespace code unit. */
    private bumpSpace;
    /**
     * Peek at the *next* Unicode codepoint in the input without advancing the parser.
     * If the input has been exhausted, then this returns null.
     */
    private peek;
}
//# sourceMappingURL=parser.d.ts.map
