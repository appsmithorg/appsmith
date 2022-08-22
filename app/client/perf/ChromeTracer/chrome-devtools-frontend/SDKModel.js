"use strict";
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDKModel = void 0;
// import * as Common from '../common/common.js';
const Object_1 = require("./Object");
const registeredModels = new Map();
// TODO(crbug.com/1228674) Remove defaults for generic type parameters once
//                         all event emitters and sinks have been migrated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SDKModel extends Object_1.ObjectWrapper {
    #targetInternal;
    constructor(target) {
        super();
        this.#targetInternal = target;
    }
    target() {
        return this.#targetInternal;
    }
    /**
     * Override this method to perform tasks that are required to suspend the
     * model and that still need other models in an unsuspended state.
     */
    async preSuspendModel(_reason) {
    }
    async suspendModel(_reason) {
    }
    async resumeModel() {
    }
    /**
     * Override this method to perform tasks that are required to after resuming
     * the model and that require all models already in an unsuspended state.
     */
    async postResumeModel() {
    }
    dispose() {
    }
    static register(modelClass, registrationInfo) {
        if (registrationInfo.early && !registrationInfo.autostart) {
            throw new Error(`Error registering model ${modelClass.name}: early models must be autostarted.`);
        }
        registeredModels.set(modelClass, registrationInfo);
    }
    static get registeredModels() {
        return registeredModels;
    }
}
exports.SDKModel = SDKModel;
//# sourceMappingURL=SDKModel.js.map