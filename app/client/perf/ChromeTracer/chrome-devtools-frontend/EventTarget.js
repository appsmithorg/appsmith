"use strict";
/* eslint-disable @typescript-eslint/ban-types */
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fireEvent = exports.removeEventListeners = void 0;
function removeEventListeners(eventList) {
    for (const eventInfo of eventList) {
        eventInfo.eventTarget.removeEventListener(eventInfo.eventType, eventInfo.listener, eventInfo.thisObject);
    }
    // Do not hold references on unused event descriptors.
    eventList.splice(0);
}
exports.removeEventListeners = removeEventListeners;
function fireEvent(name, detail = {}, target = window) {
    const evt = new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        detail,
    });
    target.dispatchEvent(evt);
}
exports.fireEvent = fireEvent;
//# sourceMappingURL=EventTarget.js.map