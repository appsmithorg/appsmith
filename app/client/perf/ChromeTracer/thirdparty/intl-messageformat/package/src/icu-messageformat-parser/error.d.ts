// MIT License
//
// Copyright (c) 2021 FormatJS
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { Location } from './types';
export interface ParserError {
    kind: ErrorKind;
    message: string;
    location: Location;
}
export declare enum ErrorKind {
    /** Argument is unclosed (e.g. `{0`) */
    EXPECT_ARGUMENT_CLOSING_BRACE = 1,
    /** Argument is empty (e.g. `{}`). */
    EMPTY_ARGUMENT = 2,
    /** Argument is malformed (e.g. `{foo!}``) */
    MALFORMED_ARGUMENT = 3,
    /** Expect an argument type (e.g. `{foo,}`) */
    EXPECT_ARGUMENT_TYPE = 4,
    /** Unsupported argument type (e.g. `{foo,foo}`) */
    INVALID_ARGUMENT_TYPE = 5,
    /** Expect an argument style (e.g. `{foo, number, }`) */
    EXPECT_ARGUMENT_STYLE = 6,
    /** The number skeleton is invalid. */
    INVALID_NUMBER_SKELETON = 7,
    /** The date time skeleton is invalid. */
    INVALID_DATE_TIME_SKELETON = 8,
    /** Exepct a number skeleton following the `::` (e.g. `{foo, number, ::}`) */
    EXPECT_NUMBER_SKELETON = 9,
    /** Exepct a date time skeleton following the `::` (e.g. `{foo, date, ::}`) */
    EXPECT_DATE_TIME_SKELETON = 10,
    /** Unmatched apostrophes in the argument style (e.g. `{foo, number, 'test`) */
    UNCLOSED_QUOTE_IN_ARGUMENT_STYLE = 11,
    /** Missing select argument options (e.g. `{foo, select}`) */
    EXPECT_SELECT_ARGUMENT_OPTIONS = 12,
    /** Expecting an offset value in `plural` or `selectordinal` argument (e.g `{foo, plural, offset}`) */
    EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE = 13,
    /** Offset value in `plural` or `selectordinal` is invalid (e.g. `{foo, plural, offset: x}`) */
    INVALID_PLURAL_ARGUMENT_OFFSET_VALUE = 14,
    /** Expecting a selector in `select` argument (e.g `{foo, select}`) */
    EXPECT_SELECT_ARGUMENT_SELECTOR = 15,
    /** Expecting a selector in `plural` or `selectordinal` argument (e.g `{foo, plural}`) */
    EXPECT_PLURAL_ARGUMENT_SELECTOR = 16,
    /** Expecting a message fragment after the `select` selector (e.g. `{foo, select, apple}`) */
    EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT = 17,
    /**
     * Expecting a message fragment after the `plural` or `selectordinal` selector
     * (e.g. `{foo, plural, one}`)
     */
    EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT = 18,
    /** Selector in `plural` or `selectordinal` is malformed (e.g. `{foo, plural, =x {#}}`) */
    INVALID_PLURAL_ARGUMENT_SELECTOR = 19,
    /**
     * Duplicate selectors in `plural` or `selectordinal` argument.
     * (e.g. {foo, plural, one {#} one {#}})
     */
    DUPLICATE_PLURAL_ARGUMENT_SELECTOR = 20,
    /** Duplicate selectors in `select` argument.
     * (e.g. {foo, select, apple {apple} apple {apple}})
     */
    DUPLICATE_SELECT_ARGUMENT_SELECTOR = 21,
    /** Plural or select argument option must have `other` clause. */
    MISSING_OTHER_CLAUSE = 22,
    /** The tag is malformed. (e.g. `<bold!>foo</bold!>) */
    INVALID_TAG = 23,
    /** The tag name is invalid. (e.g. `<123>foo</123>`) */
    INVALID_TAG_NAME = 25,
    /** The closing tag does not match the opening tag. (e.g. `<bold>foo</italic>`) */
    UNMATCHED_CLOSING_TAG = 26,
    /** The opening tag has unmatched closing tag. (e.g. `<bold>foo`) */
    UNCLOSED_TAG = 27
}
//# sourceMappingURL=error.d.ts.map
