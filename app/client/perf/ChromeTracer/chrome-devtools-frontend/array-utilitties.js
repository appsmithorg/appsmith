"use strict";
// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperBound = exports.lowerBound = exports.DEFAULT_COMPARATOR = exports.mergeOrdered = exports.intersectOrdered = exports.binaryIndexOf = exports.sortRange = exports.removeElement = void 0;
const removeElement = (array, element, firstOnly) => {
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
exports.removeElement = removeElement;
function swap(array, i1, i2) {
    const temp = array[i1];
    array[i1] = array[i2];
    array[i2] = temp;
}
function partition(array, comparator, left, right, pivotIndex) {
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
function quickSortRange(array, comparator, left, right, sortWindowLeft, sortWindowRight) {
    if (right <= left) {
        return;
    }
    const pivotIndex = Math.floor(Math.random() * (right - left)) + left;
    const pivotNewIndex = partition(array, comparator, left, right, pivotIndex);
    if (sortWindowLeft < pivotNewIndex) {
        quickSortRange(array, comparator, left, pivotNewIndex - 1, sortWindowLeft, sortWindowRight);
    }
    if (pivotNewIndex < sortWindowRight) {
        quickSortRange(array, comparator, pivotNewIndex + 1, right, sortWindowLeft, sortWindowRight);
    }
}
function sortRange(array, comparator, leftBound, rightBound, sortWindowLeft, sortWindowRight) {
    if (leftBound === 0 &&
        rightBound === array.length - 1 &&
        sortWindowLeft === 0 &&
        sortWindowRight >= rightBound) {
        array.sort(comparator);
    }
    else {
        quickSortRange(array, comparator, leftBound, rightBound, sortWindowLeft, sortWindowRight);
    }
    return array;
}
exports.sortRange = sortRange;
const binaryIndexOf = (array, value, comparator) => {
    const index = lowerBound(array, value, comparator);
    return index < array.length && comparator(value, array[index]) === 0
        ? index
        : -1;
};
exports.binaryIndexOf = binaryIndexOf;
function mergeOrIntersect(array1, array2, comparator, mergeNotIntersect) {
    const result = [];
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
const intersectOrdered = (array1, array2, comparator) => {
    return mergeOrIntersect(array1, array2, comparator, false);
};
exports.intersectOrdered = intersectOrdered;
const mergeOrdered = (array1, array2, comparator) => {
    return mergeOrIntersect(array1, array2, comparator, true);
};
exports.mergeOrdered = mergeOrdered;
const DEFAULT_COMPARATOR = (a, b) => {
    return a < b ? -1 : a > b ? 1 : 0;
};
exports.DEFAULT_COMPARATOR = DEFAULT_COMPARATOR;
function lowerBound(array, needle, comparator, left, right) {
    let l = left || 0;
    let r = right !== undefined ? right : array.length;
    while (l < r) {
        const m = (l + r) >> 1;
        if (comparator(needle, array[m]) > 0) {
            l = m + 1;
        }
        else {
            r = m;
        }
    }
    return r;
}
exports.lowerBound = lowerBound;
function upperBound(array, needle, comparator, left, right) {
    let l = left || 0;
    let r = right !== undefined ? right : array.length;
    while (l < r) {
        const m = (l + r) >> 1;
        if (comparator(needle, array[m]) >= 0) {
            l = m + 1;
        }
        else {
            r = m;
        }
    }
    return r;
}
exports.upperBound = upperBound;
//# sourceMappingURL=array-utilitties.js.map