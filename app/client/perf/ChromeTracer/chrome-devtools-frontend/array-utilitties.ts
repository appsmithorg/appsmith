// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export const removeElement = <T>(
  array: T[],
  element: T,
  firstOnly?: boolean,
): boolean => {
  let index = array.indexOf(element);
  if (index === -1) {
    return false;
  }
  if (firstOnly) {
    array.splice(index, 1);
    return true;
  }
  for (let i = index + 1, n = array.length; i < n; ++i) {
    if (array[i] !== element) {
      array[index++] = array[i];
    }
  }
  array.length = index;
  return true;
};

type NumberComparator = (a: number, b: number) => number;

function swap(array: number[], i1: number, i2: number): void {
  const temp = array[i1];
  array[i1] = array[i2];
  array[i2] = temp;
}

function partition(
  array: number[],
  comparator: NumberComparator,
  left: number,
  right: number,
  pivotIndex: number,
): number {
  const pivotValue = array[pivotIndex];
  swap(array, right, pivotIndex);
  let storeIndex = left;
  for (let i = left; i < right; ++i) {
    if (comparator(array[i], pivotValue) < 0) {
      swap(array, storeIndex, i);
      ++storeIndex;
    }
  }
  swap(array, right, storeIndex);
  return storeIndex;
}

function quickSortRange(
  array: number[],
  comparator: NumberComparator,
  left: number,
  right: number,
  sortWindowLeft: number,
  sortWindowRight: number,
): void {
  if (right <= left) {
    return;
  }
  const pivotIndex = Math.floor(Math.random() * (right - left)) + left;
  const pivotNewIndex = partition(array, comparator, left, right, pivotIndex);
  if (sortWindowLeft < pivotNewIndex) {
    quickSortRange(
      array,
      comparator,
      left,
      pivotNewIndex - 1,
      sortWindowLeft,
      sortWindowRight,
    );
  }
  if (pivotNewIndex < sortWindowRight) {
    quickSortRange(
      array,
      comparator,
      pivotNewIndex + 1,
      right,
      sortWindowLeft,
      sortWindowRight,
    );
  }
}

export function sortRange(
  array: number[],
  comparator: NumberComparator,
  leftBound: number,
  rightBound: number,
  sortWindowLeft: number,
  sortWindowRight: number,
): number[] {
  if (
    leftBound === 0 &&
    rightBound === array.length - 1 &&
    sortWindowLeft === 0 &&
    sortWindowRight >= rightBound
  ) {
    array.sort(comparator);
  } else {
    quickSortRange(
      array,
      comparator,
      leftBound,
      rightBound,
      sortWindowLeft,
      sortWindowRight,
    );
  }
  return array;
}
export const binaryIndexOf = <T, S>(
  array: T[],
  value: S,
  comparator: (a: S, b: T) => number,
): number => {
  const index = lowerBound(array, value, comparator);
  return index < array.length && comparator(value, array[index]) === 0
    ? index
    : -1;
};

function mergeOrIntersect<T>(
  array1: T[],
  array2: T[],
  comparator: (a: T, b: T) => number,
  mergeNotIntersect: boolean,
): T[] {
  const result: any = [];
  let i = 0;
  let j = 0;
  while (i < array1.length && j < array2.length) {
    const compareValue = comparator(array1[i], array2[j]);
    if (mergeNotIntersect || !compareValue) {
      result.push(compareValue <= 0 ? array1[i] : array2[j]);
    }
    if (compareValue <= 0) {
      i++;
    }
    if (compareValue >= 0) {
      j++;
    }
  }
  if (mergeNotIntersect) {
    while (i < array1.length) {
      result.push(array1[i++]);
    }
    while (j < array2.length) {
      result.push(array2[j++]);
    }
  }
  return result;
}

export const intersectOrdered = <T>(
  array1: T[],
  array2: T[],
  comparator: (a: T, b: T) => number,
): T[] => {
  return mergeOrIntersect(array1, array2, comparator, false);
};

export const mergeOrdered = <T>(
  array1: T[],
  array2: T[],
  comparator: (a: T, b: T) => number,
): T[] => {
  return mergeOrIntersect(array1, array2, comparator, true);
};

export const DEFAULT_COMPARATOR = (
  a: string | number,
  b: string | number,
): number => {
  return a < b ? -1 : a > b ? 1 : 0;
};

/**
 * Return index of the leftmost element that is equal or greater
 * than the specimen object. If there's no such element (i.e. all
 * elements are smaller than the specimen) returns right bound.
 * The function works for sorted array.
 * When specified, |left| (inclusive) and |right| (exclusive) indices
 * define the search window.
 */
export function lowerBound<T>(
  array: Uint32Array | Int32Array,
  needle: T,
  comparator: (needle: T, b: number) => number,
  left?: number,
  right?: number,
): number;
export function lowerBound<S, T>(
  array: S[],
  needle: T,
  comparator: (needle: T, b: S) => number,
  left?: number,
  right?: number,
): number;
export function lowerBound<S, T, A extends S[]>(
  array: A,
  needle: T,
  comparator: (needle: T, b: S) => number,
  left?: number,
  right?: number,
): number {
  let l = left || 0;
  let r = right !== undefined ? right : array.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (comparator(needle, array[m]) > 0) {
      l = m + 1;
    } else {
      r = m;
    }
  }
  return r;
}

/**
 * Return index of the leftmost element that is greater
 * than the specimen object. If there's no such element (i.e. all
 * elements are smaller or equal to the specimen) returns right bound.
 * The function works for sorted array.
 * When specified, |left| (inclusive) and |right| (exclusive) indices
 * define the search window.
 */
export function upperBound<T>(
  array: Uint32Array,
  needle: T,
  comparator: (needle: T, b: number) => number,
  left?: number,
  right?: number,
): number;
export function upperBound<S, T>(
  array: S[],
  needle: T,
  comparator: (needle: T, b: S) => number,
  left?: number,
  right?: number,
): number;
export function upperBound<S, T, A extends S[]>(
  array: A,
  needle: T,
  comparator: (needle: T, b: S) => number,
  left?: number,
  right?: number,
): number {
  let l = left || 0;
  let r = right !== undefined ? right : array.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (comparator(needle, array[m]) >= 0) {
      l = m + 1;
    } else {
      r = m;
    }
  }
  return r;
}
