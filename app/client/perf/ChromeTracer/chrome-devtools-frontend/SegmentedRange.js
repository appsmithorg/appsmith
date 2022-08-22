"use strict";
// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segment = void 0;
class Segment {
    begin;
    end;
    data;
    constructor(begin, end, data) {
        if (begin > end) {
            throw new Error("Invalid segment");
        }
        this.begin = begin;
        this.end = end;
        this.data = data;
    }
    intersects(that) {
        return this.begin < that.end && that.begin < this.end;
    }
}
exports.Segment = Segment;
//# sourceMappingURL=SegmentedRange.js.map