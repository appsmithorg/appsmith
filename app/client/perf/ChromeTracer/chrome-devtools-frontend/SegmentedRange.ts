// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export class Segment<T> {
  begin: number;
  end: number;
  data: T;

  constructor(begin: number, end: number, data: T) {
    if (begin > end) {
      throw new Error("Invalid segment");
    }
    this.begin = begin;
    this.end = end;
    this.data = data;
  }

  intersects(that: Segment<T>): boolean {
    return this.begin < that.end && that.begin < this.end;
  }
}
