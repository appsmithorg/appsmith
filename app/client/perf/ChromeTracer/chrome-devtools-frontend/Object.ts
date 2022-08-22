/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/ban-types */
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// import type * as Platform from '../platform/platform.js';
import {
  type EventDescriptor,
  type EventListener, type EventPayloadToRestParameters, type EventTarget,
  type EventTargetEvent
} from './EventTarget.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntersectionFromUnion<T> = (T extends any ? (arg: T) => void : never) extends((arg: infer U) => void) ? U : never;

/**
 * When writing generic code it may be desired to disallow Union types from
 * being passed. This type can be used in those cases.
 *
 *   function foo<T>(argument: NoUnion<T>) {...}
 *
 * Would result in a compile error for foo<a|b>(...); invocations as `argument`
 * would be typed as `never`.
 *
 * Adapted from https://stackoverflow.com/a/50641073.
 *
 * Conditional types become distributive when receiving a union type. To
 * prevent this from happening, we use `[T] extends [IntersectionFromUnion<T>]`
 * instead of `T extends IntersectionFromUnion<T>`.
 * See: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
export type NoUnion<T> = [T] extends [IntersectionFromUnion<T>] ? T : never;

export interface ListenerCallbackTuple<Events, T extends keyof Events> {
  thisObject?: Object;
  listener: EventListener<Events, T>;
  disposed?: boolean;
}

export class ObjectWrapper<Events> implements EventTarget<Events> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: Map<keyof Events, Set<ListenerCallbackTuple<Events, any>>>;

  addEventListener<T extends keyof Events>(eventType: T, listener: EventListener<Events, T>, thisObject?: Object):
      EventDescriptor<Events, T> {
    if (!this.listeners) {
      this.listeners = new Map();
    }

    let listenersForEventType = this.listeners.get(eventType);
    if (!listenersForEventType) {
      listenersForEventType = new Set();
      this.listeners.set(eventType, listenersForEventType);
    }
    listenersForEventType.add({thisObject, listener});
    return {eventTarget: this, eventType, thisObject, listener};
  }

  once<T extends keyof Events>(eventType: T): Promise<Events[T]> {
    return new Promise(resolve => {
      const descriptor = this.addEventListener(eventType, event => {
        this.removeEventListener(eventType, descriptor.listener);
        resolve(event.data);
      });
    });
  }

  removeEventListener<T extends keyof Events>(eventType: T, listener: EventListener<Events, T>, thisObject?: Object):
      void {
    const listeners = this.listeners?.get(eventType);
    if (!listeners) {
      return;
    }
    for (const listenerTuple of listeners) {
      if (listenerTuple.listener === listener && listenerTuple.thisObject === thisObject) {
        listenerTuple.disposed = true;
        listeners.delete(listenerTuple);
      }
    }

    if (!listeners.size) {
      this.listeners?.delete(eventType);
    }
  }

  hasEventListeners(eventType: keyof Events): boolean {
    return Boolean(this.listeners && this.listeners.has(eventType));
  }

  dispatchEventToListeners<T extends keyof Events>(
      eventType:NoUnion<T>,
      ...[eventData]: EventPayloadToRestParameters<Events, T>): void {
    const listeners = this.listeners?.get(eventType);
    if (!listeners) {
      return;
    }
    // `eventData` is typed as `Events[T] | undefined`:
    //   - `undefined` when `Events[T]` is void.
    //   - `Events[T]` otherwise.
    // We cast it to `Events[T]` which is the correct type in all instances, as
    // `void` will be cast and used as `undefined`.
    const event = {data: eventData as Events[T]};
    // Work on a snapshot of the current listeners, callbacks might remove/add
    // new listeners.
    for (const listener of [...listeners]) {
      if (!listener.disposed) {
        listener.listener.call(listener.thisObject, event);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = new (...args: any[]) => {};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function eventMixin<Events, Base extends Constructor>(base: Base) {
  return class EventHandling extends base implements EventTarget<Events> {
    #events = new ObjectWrapper<Events>();

    addEventListener<T extends keyof Events>(
        eventType: T, listener: (arg0: EventTargetEvent<Events[T]>) => void,
        thisObject?: Object): EventDescriptor<Events, T> {
      return this.#events.addEventListener(eventType, listener, thisObject);
    }

    once<T extends keyof Events>(eventType: T): Promise<Events[T]> {
      return this.#events.once(eventType);
    }

    removeEventListener<T extends keyof Events>(
        eventType: T, listener: (arg0: EventTargetEvent<Events[T]>) => void, thisObject?: Object): void {
      this.#events.removeEventListener(eventType, listener, thisObject);
    }

    hasEventListeners(eventType: keyof Events): boolean {
      return this.#events.hasEventListeners(eventType);
    }

    dispatchEventToListeners<T extends keyof Events>(
        eventType:NoUnion<T>,
        ...eventData: EventPayloadToRestParameters<Events, T>): void {
      this.#events.dispatchEventToListeners(eventType, ...eventData);
    }
  };
}
