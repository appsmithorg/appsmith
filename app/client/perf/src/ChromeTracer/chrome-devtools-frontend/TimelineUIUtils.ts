/* eslint-disable @typescript-eslint/ban-types */
// // Copyright 2021 The Chromium Authors. All rights reserved.
// // Use of this source code is governed by a BSD-style license that can be
// // found in the LICENSE file.

// /*
//  * Copyright (C) 2013 Google Inc. All rights reserved.
//  * Copyright (C) 2012 Intel Inc. All rights reserved.
//  *
//  * Redistribution and use in source and binary forms, with or without
//  * modification, are permitted provided that the following conditions are
//  * met:
//  *
//  *     * Redistributions of source code must retain the above copyright
//  * notice, this list of conditions and the following disclaimer.
//  *     * Redistributions in binary form must reproduce the above
//  * copyright notice, this list of conditions and the following disclaimer
//  * in the documentation and/or other materials provided with the
//  * distribution.
//  *     * Neither the name of Google Inc. nor the names of its
//  * contributors may be used to endorse or promote products derived from
//  * this software without specific prior written permission.
//  *
//  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
//  * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
//  * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
//  * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
//  * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//  * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
//  * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
//  * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//  */

// import * as Common from '../../core/common/common.js';
// import * as i18n from '../../core/i18n/i18n.js';
// import * as Platform from '../../core/platform/platform.js';
// import * as SDK from '../../core/sdk/sdk.js';
// import * as Bindings from '../../models/bindings/bindings.js';
// import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
// import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
// import * as Components from '../../ui/legacy/components/utils/utils.js';
// import * as UI from '../../ui/legacy/legacy.js';
// import type * as Protocol from '../../generated/protocol.js';
// import invalidationsTreeStyles from './invalidationsTree.css.js';
// // eslint-disable-next-line rulesdir/es_modules_import
// import imagePreviewStyles from '../../ui/legacy/components/utils/imagePreview.css.js';

// import {CLSRect} from './CLSLinkifier.js';
// import {TimelinePanel, TimelineSelection} from './TimelinePanel.js';

const UIStrings = {
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {node1} PH1
   *@example {node2} PH2
   */
  sAndS: "{PH1} and {PH2}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {node1} PH1
   *@example {node2} PH2
   */
  sAndSOther: "{PH1}, {PH2}, and 1 other",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  task: "Task",
  /**
   *@description Text for other types of items
   */
  other: "Other",
  /**
   *@description Text that refers to the animation of the web page
   */
  animation: "Animation",
  /**
   *@description Text that refers to some events
   */
  event: "Event",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  requestMainThreadFrame: "Request Main Thread Frame",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  frameStart: "Frame Start",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  frameStartMainThread: "Frame Start (main thread)",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  drawFrame: "Draw Frame",
  /**
   *@description The process the browser uses to determine a target element for a
   *pointer event. Typically, this is determined by considering the pointer's
   *location and also the visual layout of elements on the screen.
   */
  hitTest: "Hit Test",
  /**
   *@description Noun for an event in the Performance panel. The browser has decided
   *that the styles for some elements need to be recalculated and scheduled that
   *recalculation process at some time in the future.
   */
  scheduleStyleRecalculation: "Schedule Style Recalculation",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  recalculateStyle: "Recalculate Style",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  invalidateLayout: "Invalidate Layout",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  layout: "Layout",
  /**
   *@description Noun for an event in the Performance panel. Paint setup is a
   *step before the 'Paint' event. A paint event is when the browser draws pixels
   *to the screen. This step is the setup beforehand.
   */
  paintSetup: "Paint Setup",
  /**
   *@description Noun for a paint event in the Performance panel, where an image
   *was being painted. A paint event is when the browser draws pixels to the
   *screen, in this case specifically for an image in a website.
   */
  paintImage: "Paint Image",
  /**
   *@description Noun for an event in the Performance panel. Pre-paint is a
   *step before the 'Paint' event. A paint event is when the browser records the
   *instructions for drawing the page. This step is the setup beforehand.
   */
  prePaint: "Pre-Paint",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  updateLayer: "Update Layer",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  updateLayerTree: "Update Layer Tree",
  /**
   *@description Noun for a paint event in the Performance panel. A paint event is when the browser draws pixels to the screen.
   */
  paint: "Paint",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  rasterizePaint: "Rasterize Paint",
  /**
   *@description The action to scroll
   */
  scroll: "Scroll",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compositeLayers: "Composite Layers",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  computeIntersections: "Compute Intersections",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  parseHtml: "Parse HTML",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  parseStylesheet: "Parse Stylesheet",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  installTimer: "Install Timer",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  removeTimer: "Remove Timer",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  timerFired: "Timer Fired",
  /**
   *@description Text for an event. Shown in the timeline in the Performance panel.
   * XHR refers to XmlHttpRequest, a Web API. This particular Web API has a property
   * named 'readyState' (https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState). When
   * the 'readyState' property changes the text is shown.
   */
  xhrReadyStateChange: "`XHR` Ready State Change",
  /**
   * @description Text for an event. Shown in the timeline in the Perforamnce panel.
   * XHR refers to XmlHttpRequest, a Web API. (see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
   * The text is shown when a XmlHttpRequest load event happens on the inspected page.
   */
  xhrLoad: "`XHR` Load",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compileScript: "Compile Script",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  cacheScript: "Cache Script Code",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compileCode: "Compile Code",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  optimizeCode: "Optimize Code",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  evaluateScript: "Evaluate Script",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compileModule: "Compile Module",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  cacheModule: "Cache Module Code",
  /**
   * @description Text for an event. Shown in the timeline in the Perforamnce panel.
   * "Module" refers to JavaScript modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
   * JavaScript modules are a way to organize JavaScript code.
   * "Evaluate" is the phase when the JavaScript code of a module is executed.
   */
  evaluateModule: "Evaluate Module",
  /**
   *@description Noun indicating that a compile task (type: streaming) happened.
   */
  streamingCompileTask: "Streaming Compile Task",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  waitingForNetwork: "Waiting for Network",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  parseAndCompile: "Parse and Compile",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  streamingWasmResponse: "Streaming Wasm Response",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compiledWasmModule: "Compiled Wasm Module",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  cachedWasmModule: "Cached Wasm Module",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  wasmModuleCacheHit: "Wasm Module Cache Hit",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  wasmModuleCacheInvalid: "Wasm Module Cache Invalid",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  frameStartedLoading: "Frame Started Loading",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  onloadEvent: "Onload Event",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  domcontentloadedEvent: "DOMContentLoaded Event",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  firstPaint: "First Paint",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  firstContentfulPaint: "First Contentful Paint",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  largestContentfulPaint: "Largest Contentful Paint",
  /**
   *@description Text for timestamps of items
   */
  timestamp: "Timestamp",
  /**
   *@description Noun for a 'time' event that happens in the Console (a tool in
   * DevTools). The user can trigger console time events from their code, and
   * they will show up in the Performance panel. Time events are used to measure
   * the duration of something, e.g. the user will emit two time events at the
   * start and end of some interesting task.
   */
  consoleTime: "Console Time",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  userTiming: "User Timing",
  /**
   * @description Name for an event shown in the Performance panel. When a network
   * request is about to be sent by the browser, the time is recorded and DevTools
   * is notified that a network request will be sent momentarily.
   */
  willSendRequest: "Will Send Request",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  sendRequest: "Send Request",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  receiveResponse: "Receive Response",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  finishLoading: "Finish Loading",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  receiveData: "Receive Data",
  /**
   *@description Event category in the Performance panel for time spent to execute microtasks in JavaScript
   */
  runMicrotasks: "Run Microtasks",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  functionCall: "Function Call",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  gcEvent: "GC Event",
  /**
   *@description Event category in the Performance panel for time spent to perform a full Garbage Collection pass
   */
  majorGc: "Major GC",
  /**
   *@description Event category in the Performance panel for time spent to perform a quick Garbage Collection pass
   */
  minorGc: "Minor GC",
  /**
   *@description Event category in the Performance panel for time spent to execute JavaScript
   */
  jsFrame: "JS Frame",
  /**
   *@description Text for the request animation frame event
   */
  requestAnimationFrame: "Request Animation Frame",
  /**
   *@description Text to cancel the animation frame
   */
  cancelAnimationFrame: "Cancel Animation Frame",
  /**
   *@description Text for the event that an animation frame is fired
   */
  animationFrameFired: "Animation Frame Fired",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  requestIdleCallback: "Request Idle Callback",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  cancelIdleCallback: "Cancel Idle Callback",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  fireIdleCallback: "Fire Idle Callback",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  createWebsocket: "Create WebSocket",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  sendWebsocketHandshake: "Send WebSocket Handshake",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  receiveWebsocketHandshake: "Receive WebSocket Handshake",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  destroyWebsocket: "Destroy WebSocket",
  /**
   *@description Event category in the Performance panel for time spent in the embedder of the WebView
   */
  embedderCallback: "Embedder Callback",
  /**
   *@description Event category in the Performance panel for time spent decoding an image
   */
  imageDecode: "Image Decode",
  /**
   *@description Event category in the Performance panel for time spent to resize an image
   */
  imageResize: "Image Resize",
  /**
   *@description Event category in the Performance panel for time spent in the GPU
   */
  gpu: "GPU",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  inputLatency: "Input Latency",
  /**
   *@description Event category in the Performance panel for time spent to perform Garbage Collection for the Document Object Model
   */
  domGc: "DOM GC",
  /**
   *@description Event category in the Performance panel for time spent to perform encryption
   */
  encrypt: "Encrypt",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  encryptReply: "Encrypt Reply",
  /**
   *@description Event category in the Performance panel for time spent to perform decryption
   */
  decrypt: "Decrypt",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  decryptReply: "Decrypt Reply",
  /**
   * @description Noun phrase meaning 'the browser was preparing the digest'.
   * Digest: https://developer.mozilla.org/en-US/docs/Glossary/Digest
   */
  digest: "Digest",
  /**
   *@description Noun phrase meaning 'the browser was preparing the digest
   *reply'. Digest: https://developer.mozilla.org/en-US/docs/Glossary/Digest
   */
  digestReply: "Digest Reply",
  /**
   *@description The 'sign' stage of a web crypto event. Shown when displaying what the website was doing at a particular point in time.
   */
  sign: "Sign",
  /**
   * @description Noun phrase for an event of the Web Crypto API. The event is recorded when the signing process is concluded.
   * Signature: https://developer.mozilla.org/en-US/docs/Glossary/Signature/Security
   */
  signReply: "Sign Reply",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  verify: "Verify",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  verifyReply: "Verify Reply",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  asyncTask: "Async Task",
  /**
   *@description Text in Timeline for Layout Shift records
   */
  layoutShift: "Layout Shift",
  /**
   *@description Text in Timeline for an Event Timing record
   */
  eventTiming: "Event Timing",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  keyCharacter: "Key — Character",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  keyDown: "Key Down",
  /**
   *@description Noun for the end keyboard key event in the Performance panel. 'Up' refers to the keyboard key bouncing back up after being pushed down.
   */
  keyUp: "Key Up",
  /**
   *@description Noun for a mouse click event in the Performance panel.
   */
  click: "Click",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  contextMenu: "Context Menu",
  /**
   *@description Noun for the start of a mouse event in the Performance panel. Down refers to the button on the mouse being pressed down.
   */
  mouseDown: "Mouse Down",
  /**
   *@description Noun for a mouse move event in the Performance panel.
   */
  mouseMove: "Mouse Move",
  /**
   *@description Noun for the end of a mouse event in the Performance panel. Up refers to the button on the mouse being released.
   */
  mouseUp: "Mouse Up",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  mouseWheel: "Mouse Wheel",
  /**
   *@description Noun for the beginning of a mouse scroll wheel event in the Performance panel.
   */
  scrollBegin: "Scroll Begin",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  scrollEnd: "Scroll End",
  /**
   *@description Noun for an update of a mouse scroll wheel event in the Performance panel.
   */
  scrollUpdate: "Scroll Update",
  /**
   *@description Noun for the beginning of a fling gesture event in the Performance panel.
   */
  flingStart: "Fling Start",
  /**
   *@description Noun for the end of a fling gesture event in the Performance panel.
   */
  flingHalt: "Fling Halt",
  /**
   *@description Noun for a tap event (tap on a touch screen device) in the Performance panel.
   */
  tap: "Tap",
  /**
   *@description Noun for the end of a tap event (tap on a touch screen device) in the Performance panel.
   */
  tapHalt: "Tap Halt",
  /**
   *@description Noun for the start of a tap event (tap on a touch screen device) in the Performance panel.
   */
  tapBegin: "Tap Begin",
  /**
   *@description Noun for the beginning of a tap gesture event in the Performance
   *panel. 'Down' refers to the start (downward tap direction), as opposed to up
   *(finger leaving the touch surface).
   */
  tapDown: "Tap Down",
  /**
   * @description Noun for the cancelation of an input touch event in the Performance panel.
   * For example this can happen when the user touches the surface with too many fingers.
   * This is opposed to a "Touch End" event, where the user lifts the finger from the surface.
   */
  touchCancel: "Touch Cancel",
  /**
   *@description Noun for the end of an input touch event in the Performance panel.
   */
  touchEnd: "Touch End",
  /**
   *@description Noun for an input touch event in the Performance panel.
   */
  touchMove: "Touch Move",
  /**
   *@description Noun for the start of an input touch event in the Performance panel.
   */
  touchStart: "Touch Start",
  /**
   *@description Noun for the beginning of a pinch gesture event in the Performance panel.
   */
  pinchBegin: "Pinch Begin",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  pinchEnd: "Pinch End",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  pinchUpdate: "Pinch Update",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compile: "Compile",
  /**
   *@description Text to parse something
   */
  parse: "Parse",
  /**
   *@description Text shown when rendering an interaction/
   *@example {click} PH1
   *@example {1200} PH2
   */
  interactionEvent: "Interaction type:{PH1} id:{PH2}",
  /**
   *@description Text with two placeholders separated by a colon
   *@example {Node removed} PH1
   *@example {div#id1} PH2
   */
  sS: "{PH1}: {PH2}",
  /**
  *@description Label of a field in a timeline. A Network response refers to the act of acknowledging a
  network request. Should not be confused with answer.
  */
  response: "Response",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  fling: "Fling",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  drag: "Drag",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  uncategorized: "Uncategorized",
  /**
   *@description Details text in Timeline UIUtils of the Performance panel
   *@example {30 MB} PH1
   */
  sCollected: "{PH1} collected",
  /**
   *@description Details text in Timeline UIUtils of the Performance panel
   *@example {https://example.com} PH1
   *@example {2} PH2
   *@example {4} PH3
   */
  sSs: "{PH1} [{PH2}…{PH3}]",
  /**
   *@description Details text in Timeline UIUtils of the Performance panel
   *@example {https://example.com} PH1
   *@example {2} PH2
   */
  sSSquareBrackets: "{PH1} [{PH2}…]",
  /**
   *@description Text that is usually a hyperlink to more documentation
   */
  learnMore: "Learn more",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compilationCacheStatus: "Compilation cache status",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  compilationCacheSize: "Compilation cache size",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  scriptLoadedFromCache: "script loaded from cache",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  failedToLoadScriptFromCache: "failed to load script from cache",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  scriptNotEligible: "script not eligible",
  /**
   *@description Text for the total time of something
   */
  totalTime: "Total Time",
  /**
   *@description Time of a single activity, as opposed to the total time
   */
  selfTime: "Self Time",
  /**
   *@description Label in the summary view in the Performance panel for a number which indicates how much managed memory has been reclaimed by performing Garbage Collection
   */
  collected: "Collected",
  /**
   *@description Text for a programming function
   */
  function: "Function",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  timerId: "Timer ID",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  timeout: "Timeout",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  repeats: "Repeats",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  callbackId: "Callback ID",
  /**
   *@description Text that refers to the resources of the web page
   */
  resource: "Resource",
  /**
   *@description Text that refers to the network request method
   */
  requestMethod: "Request Method",
  /**
   *@description Status code of an event
   */
  statusCode: "Status Code",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  mimeTypeCaps: "MIME Type",
  /**
   *@description Text to show the priority of an item
   */
  priority: "Priority",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  encodedData: "Encoded Data",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  sBytes: "{n, plural, =1 {# Byte} other {# Bytes}}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  decodedBody: "Decoded Body",
  /**
   *@description Text for a module, the programming concept
   */
  module: "Module",
  /**
   *@description Label for a group of JavaScript files
   */
  script: "Script",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  streamed: "Streamed",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  eagerCompile: "Compiling all functions eagerly",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  url: "Url",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  producedCacheSize: "Produced Cache Size",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  consumedCacheSize: "Consumed Cache Size",
  /**
   *@description Title for a group of cities
   */
  location: "Location",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {2} PH1
   *@example {2} PH2
   */
  sSCurlyBrackets: "({PH1}, {PH2})",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  dimensions: "Dimensions",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {2} PH1
   *@example {2} PH2
   */
  sSDimensions: "{PH1} × {PH2}",
  /**
   *@description Related node label in Timeline UIUtils of the Performance panel
   */
  layerRoot: "Layer Root",
  /**
   *@description Related node label in Timeline UIUtils of the Performance panel
   */
  ownerElement: "Owner Element",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  imageUrl: "Image URL",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  stylesheetUrl: "Stylesheet URL",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  elementsAffected: "Elements Affected",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  nodesThatNeedLayout: "Nodes That Need Layout",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {2} PH1
   *@example {10} PH2
   */
  sOfS: "{PH1} of {PH2}",
  /**
   *@description Related node label in Timeline UIUtils of the Performance panel
   */
  layoutRoot: "Layout root",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  message: "Message",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  websocketProtocol: "WebSocket Protocol",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  callbackFunction: "Callback Function",
  /**
   *@description The current state of an item
   */
  state: "State",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  range: "Range",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  allottedTime: "Allotted Time",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  invokedByTimeout: "Invoked by Timeout",
  /**
   *@description Text that refers to some types
   */
  type: "Type",
  /**
   *@description Text for the size of something
   */
  size: "Size",
  /**
   *@description Text for the details of something
   */
  details: "Details",
  /**
   *@description Title in Timeline for Cumulative Layout Shifts
   */
  cumulativeLayoutShifts: "Cumulative Layout Shifts",
  /**
   *@description Text for the link to the evolved CLS website
   */
  evolvedClsLink: "evolved",
  /**
   *@description Warning in Timeline that CLS can cause a poor user experience. It contains a link to inform developers about the recent changes to how CLS is measured. The new CLS metric is said to have evolved from the previous version.
   *@example {Link to web.dev/metrics} PH1
   *@example {Link to web.dev/evolving-cls which will always have the text 'evolved'} PH2
   */
  sCLSInformation:
    "{PH1} can result in poor user experiences. It has recently {PH2}.",
  /**
   *@description Text to indicate an item is a warning
   */
  warning: "Warning",
  /**
   *@description Title for the Timeline CLS Score
   */
  score: "Score",
  /**
   *@description Text in Timeline for the cumulative CLS score
   */
  cumulativeScore: "Cumulative Score",
  /**
   *@description Text in Timeline for the current CLS score
   */
  currentClusterScore: "Current Cluster Score",
  /**
   *@description Text in Timeline for the current CLS cluster
   */
  currentClusterId: "Current Cluster ID",
  /**
   *@description Text in Timeline for whether input happened recently
   */
  hadRecentInput: "Had recent input",
  /**
   *@description Text in Timeline indicating that input has happened recently
   */
  yes: "Yes",
  /**
   *@description Text in Timeline indicating that input has not happened recently
   */
  no: "No",
  /**
   *@description Label for Cumulative Layout records, indicating where they moved from
   */
  movedFrom: "Moved from",
  /**
   *@description Label for Cumulative Layout records, indicating where they moved to
   */
  movedTo: "Moved to",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  timeWaitingForMainThread: "Time Waiting for Main Thread",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  relatedNode: "Related Node",
  /**
   *@description Text for previewing items
   */
  preview: "Preview",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  aggregatedTime: "Aggregated Time",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  networkRequest: "Network request",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  loadFromCache: "load from cache",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  networkTransfer: "network transfer",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {1ms} PH1
   *@example {network transfer} PH2
   *@example {1ms} PH3
   */
  SSSResourceLoading: " ({PH1} {PH2} + {PH3} resource loading)",
  /**
   *@description Text for the duration of something
   */
  duration: "Duration",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  mimeType: "Mime Type",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  FromMemoryCache: " (from memory cache)",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  FromCache: " (from cache)",
  /**
   *@description Label for a network request indicating that it was a HTTP2 server push instead of a regular network request, in the Performance panel
   */
  FromPush: " (from push)",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  FromServiceWorker: " (from `service worker`)",
  /**
   *@description Text for the initiator of something
   */
  initiator: "Initiator",
  /**
   *@description Call site stack label in Timeline UIUtils of the Performance panel
   */
  timerInstalled: "Timer Installed",
  /**
   *@description Call site stack label in Timeline UIUtils of the Performance panel
   */
  animationFrameRequested: "Animation Frame Requested",
  /**
   *@description Call site stack label in Timeline UIUtils of the Performance panel
   */
  idleCallbackRequested: "Idle Callback Requested",
  /**
   *@description Stack label in Timeline UIUtils of the Performance panel
   */
  recalculationForced: "Recalculation Forced",
  /**
   *@description Call site stack label in Timeline UIUtils of the Performance panel
   */
  firstLayoutInvalidation: "First Layout Invalidation",
  /**
   *@description Stack label in Timeline UIUtils of the Performance panel
   */
  layoutForced: "Layout Forced",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  callStacks: "Call Stacks",
  /**
   *@description Text for the execution stack trace
   */
  stackTrace: "Stack Trace",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  invalidations: "Invalidations",
  /**
   * @description Text in Timeline UIUtils of the Performance panel. Phrase is followed by a number of milliseconds.
   * Some events or tasks might have been only started, but have not ended yet. Such events or tasks are considered
   * "pending".
   */
  pendingFor: "Pending for",
  /**
   *@description Text for revealing an item in its destination
   */
  reveal: "Reveal",
  /**
   *@description Noun label for a stack trace which indicates the first time some condition was invalidated.
   */
  firstInvalidated: "First Invalidated",
  /**
   *@description Title in Timeline UIUtils of the Performance panel
   */
  styleInvalidations: "Style Invalidations",
  /**
   *@description Title in Timeline UIUtils of the Performance panel
   */
  layoutInvalidations: "Layout Invalidations",
  /**
   *@description Title in Timeline UIUtils of the Performance panel
   */
  otherInvalidations: "Other Invalidations",
  /**
   *@description Title of the paint profiler, old name of the performance pane
   */
  paintProfiler: "Paint Profiler",
  /**
   *@description Text in Timeline Flame Chart View of the Performance panel
   *@example {Frame} PH1
   *@example {10ms} PH2
   */
  sAtS: "{PH1} at {PH2}",
  /**
   *@description Category in the Summary view of the Performance panel to indicate time spent to load resources
   */
  loading: "Loading",
  /**
   *@description Text in Timeline for the Experience title
   */
  experience: "Experience",
  /**
   *@description Category in the Summary view of the Performance panel to indicate time spent in script execution
   */
  scripting: "Scripting",
  /**
   *@description Category in the Summary view of the Performance panel to indicate time spent in rendering the web page
   */
  rendering: "Rendering",
  /**
   *@description Category in the Summary view of the Performance panel to indicate time spent to visually represent the web page
   */
  painting: "Painting",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  async: "Async",
  /**
   *@description Category in the Summary view of the Performance panel to indicate time spent in the rest of the system
   */
  system: "System",
  /**
   *@description Category in the Summary view of the Performance panel to indicate idle time
   */
  idle: "Idle",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {blink.console} PH1
   */
  sSelf: "{PH1} (self)",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {blink.console} PH1
   */
  sChildren: "{PH1} (children)",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  timeSpentInRendering: "Time spent in rendering",
  /**
   *@description Text for a rendering frame
   */
  frame: "Frame",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  cpuTime: "CPU time",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  layerTree: "Layer tree",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  show: "Show",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {10ms} PH1
   *@example {10ms} PH2
   */
  sAtSParentheses: "{PH1} (at {PH2})",
  /**
   *@description Text that only contain a placeholder
   *@example {100ms (at 200ms)} PH1
   */
  emptyPlaceholder: "{PH1}", // eslint-disable-line rulesdir/l10n_no_locked_or_placeholder_only_phrase
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  jank: "jank",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {Took 3ms} PH1
   *@example {jank} PH2
   */
  sLongFrameTimesAreAnIndicationOf:
    "{PH1}. Long frame times are an indication of {PH2}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  forcedReflow: "Forced reflow",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {Forced reflow} PH1
   */
  sIsALikelyPerformanceBottleneck: "{PH1} is a likely performance bottleneck.",
  /**
   *@description Span text content in Timeline UIUtils of the Performance panel
   *@example {10ms} PH1
   */
  idleCallbackExecutionExtended:
    "Idle callback execution extended beyond deadline by {PH1}",
  /**
   *@description Span text content in Timeline UIUtils of the Performance panel
   *@example {10ms} PH1
   */
  handlerTookS: "Handler took {PH1}",
  /**
   *@description Warning to the user in the Performance panel that an input handler, which was run multiple times, took too long. Placeholder text is time in ms.
   *@example {20ms} PH1
   */
  recurringHandlerTookS: "Recurring handler took {PH1}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  longTask: "Long task",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {task} PH1
   *@example {10ms} PH2
   */
  sTookS: "{PH1} took {PH2}.",
  /**
   *@description Text that indicates something is not optimized
   */
  notOptimized: "Not optimized",
  /**
   *@description Text that starts with a colon and includes a placeholder
   *@example {3.0} PH1
   */
  emptyPlaceholderColon: ": {PH1}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  unknownCause: "Unknown cause",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {Unkown reason} PH1
   *@example {node1} PH2
   */
  sForS: "{PH1} for {PH2}",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {StyleInvalidator for element} PH1
   *@example {Stack trace: function  line} PH2
   */
  sSDot: "{PH1}. {PH2}",
  /**
   *@description Text in Object Properties Section
   */
  unknown: "unknown",
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   */
  stackTraceColon: "Stack trace:",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  nodes: "Nodes:",
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   */
  node: "Node:",
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   *@example {id2} PH1
   *@example {a, b} PH2
   */
  changedIdToSs: '(changed id to "{PH1}"{PH2})',
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   *@example {class-name2} PH1
   *@example {a, b} PH2
   */
  changedClassToSs: '(changed class to "{PH1}"{PH2})',
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   *@example {attribute-name} PH1
   *@example {a, b} PH2
   */
  changedAttributeToSs: '(changed attribute to "{PH1}"{PH2})',
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   *@example {after} PH1
   *@example {a, b} PH2
   */
  changedPesudoToSs: '(changed pseudo to "{PH1}"{PH2})',
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   *@example {part} PH1
   *@example {a, b} PH2
   */
  changedSs: '(changed "{PH1}"{PH2})',
  /**
   *@description Text in Timeline UIUtils of the Performance panel
   *@example {node1} PH1
   *@example {node2} PH2
   *@example {2} PH3
   */
  sSAndSOthers: "{PH1}, {PH2}, and {PH3} others",
  /**
   *@description Text of a DOM element in Timeline UIUtils of the Performance panel
   */
  UnknownNode: "[ unknown node ]",
};
// const str_ = i18n.i18n.registerUIStrings('panels/timeline/TimelineUIUtils.ts', UIStrings);
// const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

// let eventStylesMap: EventStylesMap;

// let inputEventToDisplayName: Map<TimelineModel.TimelineIRModel.InputEvents, string>;

// let interactionPhaseStylesMap: Map<TimelineModel.TimelineIRModel.Phases, {
//   color: string,
//   label: string,
// }>;

// let categories: {
//   [x: string]: TimelineCategory,
// };

// let eventCategories: string[];

// let eventDispatchDesciptors: EventDispatchTypeDescriptor[];

// let colorGenerator: Common.Color.Generator;

// const requestPreviewElements = new WeakMap<TimelineModel.TimelineModel.NetworkRequest, HTMLImageElement>();

// interface EventStylesMap {
//   [x: string]: TimelineRecordStyle;
// }
// export class TimelineUIUtils {
//   private static initEventStyles(): EventStylesMap {
//     if (eventStylesMap) {
//       return eventStylesMap;
//     }

//     const type = TimelineModel.TimelineModel.RecordType;
//     const categories = TimelineUIUtils.categories();
//     const rendering = categories['rendering'];
//     const scripting = categories['scripting'];
//     const loading = categories['loading'];
//     const experience = categories['experience'];
//     const painting = categories['painting'];
//     const other = categories['other'];
//     const idle = categories['idle'];

//     const eventStyles: EventStylesMap = {};
//     eventStyles[type.Task] = new TimelineRecordStyle(i18nString(UIStrings.task), other);
//     eventStyles[type.Program] = new TimelineRecordStyle(i18nString(UIStrings.other), other);
//     eventStyles[type.Animation] = new TimelineRecordStyle(i18nString(UIStrings.animation), rendering);
//     eventStyles[type.EventDispatch] = new TimelineRecordStyle(i18nString(UIStrings.event), scripting);
//     eventStyles[type.RequestMainThreadFrame] =
//         new TimelineRecordStyle(i18nString(UIStrings.requestMainThreadFrame), rendering, true);
//     eventStyles[type.BeginFrame] = new TimelineRecordStyle(i18nString(UIStrings.frameStart), rendering, true);
//     eventStyles[type.BeginMainThreadFrame] =
//         new TimelineRecordStyle(i18nString(UIStrings.frameStartMainThread), rendering, true);
//     eventStyles[type.DrawFrame] = new TimelineRecordStyle(i18nString(UIStrings.drawFrame), rendering, true);
//     eventStyles[type.HitTest] = new TimelineRecordStyle(i18nString(UIStrings.hitTest), rendering);
//     eventStyles[type.ScheduleStyleRecalculation] =
//         new TimelineRecordStyle(i18nString(UIStrings.scheduleStyleRecalculation), rendering);
//     eventStyles[type.RecalculateStyles] = new TimelineRecordStyle(i18nString(UIStrings.recalculateStyle), rendering);
//     eventStyles[type.UpdateLayoutTree] = new TimelineRecordStyle(i18nString(UIStrings.recalculateStyle), rendering);
//     eventStyles[type.InvalidateLayout] =
//         new TimelineRecordStyle(i18nString(UIStrings.invalidateLayout), rendering, true);
//     eventStyles[type.Layout] = new TimelineRecordStyle(i18nString(UIStrings.layout), rendering);
//     eventStyles[type.PaintSetup] = new TimelineRecordStyle(i18nString(UIStrings.paintSetup), painting);
//     eventStyles[type.PaintImage] = new TimelineRecordStyle(i18nString(UIStrings.paintImage), painting, true);
//     eventStyles[type.UpdateLayer] = new TimelineRecordStyle(i18nString(UIStrings.updateLayer), painting, true);
//     eventStyles[type.UpdateLayerTree] = new TimelineRecordStyle(i18nString(UIStrings.updateLayerTree), rendering);
//     eventStyles[type.Paint] = new TimelineRecordStyle(i18nString(UIStrings.paint), painting);
//     eventStyles[type.PrePaint] = new TimelineRecordStyle(i18nString(UIStrings.prePaint), rendering);
//     eventStyles[type.RasterTask] = new TimelineRecordStyle(i18nString(UIStrings.rasterizePaint), painting);
//     eventStyles[type.ScrollLayer] = new TimelineRecordStyle(i18nString(UIStrings.scroll), rendering);
//     eventStyles[type.CompositeLayers] = new TimelineRecordStyle(i18nString(UIStrings.compositeLayers), painting);
//     eventStyles[type.ComputeIntersections] =
//         new TimelineRecordStyle(i18nString(UIStrings.computeIntersections), rendering);
//     eventStyles[type.ParseHTML] = new TimelineRecordStyle(i18nString(UIStrings.parseHtml), loading);
//     eventStyles[type.ParseAuthorStyleSheet] = new TimelineRecordStyle(i18nString(UIStrings.parseStylesheet), loading);
//     eventStyles[type.TimerInstall] = new TimelineRecordStyle(i18nString(UIStrings.installTimer), scripting);
//     eventStyles[type.TimerRemove] = new TimelineRecordStyle(i18nString(UIStrings.removeTimer), scripting);
//     eventStyles[type.TimerFire] = new TimelineRecordStyle(i18nString(UIStrings.timerFired), scripting);
//     eventStyles[type.XHRReadyStateChange] =
//         new TimelineRecordStyle(i18nString(UIStrings.xhrReadyStateChange), scripting);
//     eventStyles[type.XHRLoad] = new TimelineRecordStyle(i18nString(UIStrings.xhrLoad), scripting);
//     eventStyles[type.CompileScript] = new TimelineRecordStyle(i18nString(UIStrings.compileScript), scripting);
//     eventStyles[type.CacheScript] = new TimelineRecordStyle(i18nString(UIStrings.cacheScript), scripting);
//     eventStyles[type.CompileCode] = new TimelineRecordStyle(i18nString(UIStrings.compileCode), scripting);
//     eventStyles[type.OptimizeCode] = new TimelineRecordStyle(i18nString(UIStrings.optimizeCode), scripting);
//     eventStyles[type.EvaluateScript] = new TimelineRecordStyle(i18nString(UIStrings.evaluateScript), scripting);
//     eventStyles[type.CompileModule] = new TimelineRecordStyle(i18nString(UIStrings.compileModule), scripting);
//     eventStyles[type.CacheModule] = new TimelineRecordStyle(i18nString(UIStrings.cacheModule), scripting);
//     eventStyles[type.EvaluateModule] = new TimelineRecordStyle(i18nString(UIStrings.evaluateModule), scripting);
//     eventStyles[type.StreamingCompileScript] =
//         new TimelineRecordStyle(i18nString(UIStrings.streamingCompileTask), other);
//     eventStyles[type.StreamingCompileScriptWaiting] =
//         new TimelineRecordStyle(i18nString(UIStrings.waitingForNetwork), idle);
//     eventStyles[type.StreamingCompileScriptParsing] =
//         new TimelineRecordStyle(i18nString(UIStrings.parseAndCompile), scripting);
//     eventStyles[type.WasmStreamFromResponseCallback] =
//         new TimelineRecordStyle(i18nString(UIStrings.streamingWasmResponse), scripting);
//     eventStyles[type.WasmCompiledModule] = new TimelineRecordStyle(i18nString(UIStrings.compiledWasmModule), scripting);
//     eventStyles[type.WasmCachedModule] = new TimelineRecordStyle(i18nString(UIStrings.cachedWasmModule), scripting);
//     eventStyles[type.WasmModuleCacheHit] = new TimelineRecordStyle(i18nString(UIStrings.wasmModuleCacheHit), scripting);
//     eventStyles[type.WasmModuleCacheInvalid] =
//         new TimelineRecordStyle(i18nString(UIStrings.wasmModuleCacheInvalid), scripting);
//     eventStyles[type.FrameStartedLoading] =
//         new TimelineRecordStyle(i18nString(UIStrings.frameStartedLoading), loading, true);
//     eventStyles[type.MarkLoad] = new TimelineRecordStyle(i18nString(UIStrings.onloadEvent), scripting, true);
//     eventStyles[type.MarkDOMContent] =
//         new TimelineRecordStyle(i18nString(UIStrings.domcontentloadedEvent), scripting, true);
//     eventStyles[type.MarkFirstPaint] = new TimelineRecordStyle(i18nString(UIStrings.firstPaint), painting, true);
//     eventStyles[type.MarkFCP] = new TimelineRecordStyle(i18nString(UIStrings.firstContentfulPaint), rendering, true);
//     eventStyles[type.MarkLCPCandidate] =
//         new TimelineRecordStyle(i18nString(UIStrings.largestContentfulPaint), rendering, true);
//     eventStyles[type.TimeStamp] = new TimelineRecordStyle(i18nString(UIStrings.timestamp), scripting);
//     eventStyles[type.ConsoleTime] = new TimelineRecordStyle(i18nString(UIStrings.consoleTime), scripting);
//     eventStyles[type.UserTiming] = new TimelineRecordStyle(i18nString(UIStrings.userTiming), scripting);
//     eventStyles[type.ResourceWillSendRequest] = new TimelineRecordStyle(i18nString(UIStrings.willSendRequest), loading);
//     eventStyles[type.ResourceSendRequest] = new TimelineRecordStyle(i18nString(UIStrings.sendRequest), loading);
//     eventStyles[type.ResourceReceiveResponse] = new TimelineRecordStyle(i18nString(UIStrings.receiveResponse), loading);
//     eventStyles[type.ResourceFinish] = new TimelineRecordStyle(i18nString(UIStrings.finishLoading), loading);
//     eventStyles[type.ResourceReceivedData] = new TimelineRecordStyle(i18nString(UIStrings.receiveData), loading);
//     eventStyles[type.RunMicrotasks] = new TimelineRecordStyle(i18nString(UIStrings.runMicrotasks), scripting);
//     eventStyles[type.FunctionCall] = new TimelineRecordStyle(i18nString(UIStrings.functionCall), scripting);
//     eventStyles[type.GCEvent] = new TimelineRecordStyle(i18nString(UIStrings.gcEvent), scripting);
//     eventStyles[type.MajorGC] = new TimelineRecordStyle(i18nString(UIStrings.majorGc), scripting);
//     eventStyles[type.MinorGC] = new TimelineRecordStyle(i18nString(UIStrings.minorGc), scripting);
//     eventStyles[type.JSFrame] = new TimelineRecordStyle(i18nString(UIStrings.jsFrame), scripting);
//     eventStyles[type.RequestAnimationFrame] =
//         new TimelineRecordStyle(i18nString(UIStrings.requestAnimationFrame), scripting);
//     eventStyles[type.CancelAnimationFrame] =
//         new TimelineRecordStyle(i18nString(UIStrings.cancelAnimationFrame), scripting);
//     eventStyles[type.FireAnimationFrame] =
//         new TimelineRecordStyle(i18nString(UIStrings.animationFrameFired), scripting);
//     eventStyles[type.RequestIdleCallback] =
//         new TimelineRecordStyle(i18nString(UIStrings.requestIdleCallback), scripting);
//     eventStyles[type.CancelIdleCallback] = new TimelineRecordStyle(i18nString(UIStrings.cancelIdleCallback), scripting);
//     eventStyles[type.FireIdleCallback] = new TimelineRecordStyle(i18nString(UIStrings.fireIdleCallback), scripting);
//     eventStyles[type.WebSocketCreate] = new TimelineRecordStyle(i18nString(UIStrings.createWebsocket), scripting);
//     eventStyles[type.WebSocketSendHandshakeRequest] =
//         new TimelineRecordStyle(i18nString(UIStrings.sendWebsocketHandshake), scripting);
//     eventStyles[type.WebSocketReceiveHandshakeResponse] =
//         new TimelineRecordStyle(i18nString(UIStrings.receiveWebsocketHandshake), scripting);
//     eventStyles[type.WebSocketDestroy] = new TimelineRecordStyle(i18nString(UIStrings.destroyWebsocket), scripting);
//     eventStyles[type.EmbedderCallback] = new TimelineRecordStyle(i18nString(UIStrings.embedderCallback), scripting);
//     eventStyles[type.DecodeImage] = new TimelineRecordStyle(i18nString(UIStrings.imageDecode), painting);
//     eventStyles[type.ResizeImage] = new TimelineRecordStyle(i18nString(UIStrings.imageResize), painting);
//     eventStyles[type.GPUTask] = new TimelineRecordStyle(i18nString(UIStrings.gpu), categories['gpu']);
//     eventStyles[type.LatencyInfo] = new TimelineRecordStyle(i18nString(UIStrings.inputLatency), scripting);

//     eventStyles[type.GCCollectGarbage] = new TimelineRecordStyle(i18nString(UIStrings.domGc), scripting);

//     eventStyles[type.CryptoDoEncrypt] = new TimelineRecordStyle(i18nString(UIStrings.encrypt), scripting);
//     eventStyles[type.CryptoDoEncryptReply] = new TimelineRecordStyle(i18nString(UIStrings.encryptReply), scripting);
//     eventStyles[type.CryptoDoDecrypt] = new TimelineRecordStyle(i18nString(UIStrings.decrypt), scripting);
//     eventStyles[type.CryptoDoDecryptReply] = new TimelineRecordStyle(i18nString(UIStrings.decryptReply), scripting);
//     eventStyles[type.CryptoDoDigest] = new TimelineRecordStyle(i18nString(UIStrings.digest), scripting);
//     eventStyles[type.CryptoDoDigestReply] = new TimelineRecordStyle(i18nString(UIStrings.digestReply), scripting);
//     eventStyles[type.CryptoDoSign] = new TimelineRecordStyle(i18nString(UIStrings.sign), scripting);
//     eventStyles[type.CryptoDoSignReply] = new TimelineRecordStyle(i18nString(UIStrings.signReply), scripting);
//     eventStyles[type.CryptoDoVerify] = new TimelineRecordStyle(i18nString(UIStrings.verify), scripting);
//     eventStyles[type.CryptoDoVerifyReply] = new TimelineRecordStyle(i18nString(UIStrings.verifyReply), scripting);

//     eventStyles[type.AsyncTask] = new TimelineRecordStyle(i18nString(UIStrings.asyncTask), categories['async']);

//     eventStyles[type.LayoutShift] = new TimelineRecordStyle(i18nString(UIStrings.layoutShift), experience);

//     eventStyles[type.EventTiming] = new TimelineRecordStyle(UIStrings.eventTiming, experience);

//     eventStylesMap = eventStyles;
//     return eventStyles;
//   }

//   // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   static setEventStylesMap(eventStyles: any): void {
//     eventStylesMap = eventStyles;
//   }

//   static inputEventDisplayName(inputEventType: TimelineModel.TimelineIRModel.InputEvents): string|null {
//     if (!inputEventToDisplayName) {
//       const inputEvent = TimelineModel.TimelineIRModel.InputEvents;

//       inputEventToDisplayName = new Map([
//         [inputEvent.Char, i18nString(UIStrings.keyCharacter)],
//         [inputEvent.KeyDown, i18nString(UIStrings.keyDown)],
//         [inputEvent.KeyDownRaw, i18nString(UIStrings.keyDown)],
//         [inputEvent.KeyUp, i18nString(UIStrings.keyUp)],
//         [inputEvent.Click, i18nString(UIStrings.click)],
//         [inputEvent.ContextMenu, i18nString(UIStrings.contextMenu)],
//         [inputEvent.MouseDown, i18nString(UIStrings.mouseDown)],
//         [inputEvent.MouseMove, i18nString(UIStrings.mouseMove)],
//         [inputEvent.MouseUp, i18nString(UIStrings.mouseUp)],
//         [inputEvent.MouseWheel, i18nString(UIStrings.mouseWheel)],
//         [inputEvent.ScrollBegin, i18nString(UIStrings.scrollBegin)],
//         [inputEvent.ScrollEnd, i18nString(UIStrings.scrollEnd)],
//         [inputEvent.ScrollUpdate, i18nString(UIStrings.scrollUpdate)],
//         [inputEvent.FlingStart, i18nString(UIStrings.flingStart)],
//         [inputEvent.FlingCancel, i18nString(UIStrings.flingHalt)],
//         [inputEvent.Tap, i18nString(UIStrings.tap)],
//         [inputEvent.TapCancel, i18nString(UIStrings.tapHalt)],
//         [inputEvent.ShowPress, i18nString(UIStrings.tapBegin)],
//         [inputEvent.TapDown, i18nString(UIStrings.tapDown)],
//         [inputEvent.TouchCancel, i18nString(UIStrings.touchCancel)],
//         [inputEvent.TouchEnd, i18nString(UIStrings.touchEnd)],
//         [inputEvent.TouchMove, i18nString(UIStrings.touchMove)],
//         [inputEvent.TouchStart, i18nString(UIStrings.touchStart)],
//         [inputEvent.PinchBegin, i18nString(UIStrings.pinchBegin)],
//         [inputEvent.PinchEnd, i18nString(UIStrings.pinchEnd)],
//         [inputEvent.PinchUpdate, i18nString(UIStrings.pinchUpdate)],
//       ]);
//     }
//     return inputEventToDisplayName.get(inputEventType) || null;
//   }

//   static frameDisplayName(frame: Protocol.Runtime.CallFrame): string {
//     if (!TimelineModel.TimelineJSProfile.TimelineJSProfileProcessor.isNativeRuntimeFrame(frame)) {
//       return UI.UIUtils.beautifyFunctionName(frame.functionName);
//     }
//     const nativeGroup = TimelineModel.TimelineJSProfile.TimelineJSProfileProcessor.nativeGroup(frame.functionName);
//     const groups = TimelineModel.TimelineJSProfile.TimelineJSProfileProcessor.NativeGroups;
//     switch (nativeGroup) {
//       case groups.Compile:
//         return i18nString(UIStrings.compile);
//       case groups.Parse:
//         return i18nString(UIStrings.parse);
//     }
//     return frame.functionName;
//   }

//   static testContentMatching(traceEvent: SDK.TracingModel.Event, regExp: RegExp): boolean {
//     const title = TimelineUIUtils.eventStyle(traceEvent).title;
//     const tokens = [title];
//     const url = TimelineModel.TimelineModel.TimelineData.forEvent(traceEvent).url;
//     if (url) {
//       tokens.push(url);
//     }
//     appendObjectProperties(traceEvent.args, 2);
//     return regExp.test(tokens.join('|'));

//     // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     function appendObjectProperties(object: any, depth: number): void {
//       if (!depth) {
//         return;
//       }
//       for (const key in object) {
//         const value = object[key];
//         const type = typeof value;
//         if (type === 'string') {
//           tokens.push(value);
//         } else if (type === 'number') {
//           tokens.push(String(value));
//         } else if (type === 'object') {
//           appendObjectProperties(value, depth - 1);
//         }
//       }
//     }
//   }

//   static eventURL(event: SDK.TracingModel.Event): Platform.DevToolsPath.UrlString|null {
//     const data = event.args['data'] || event.args['beginData'];
//     const url = data && data.url;
//     if (url) {
//       return url;
//     }
//     const stackTrace = data && data['stackTrace'];
//     const frame = stackTrace && stackTrace.length && stackTrace[0] ||
//         TimelineModel.TimelineModel.TimelineData.forEvent(event).topFrame();
//     return frame && frame.url as Platform.DevToolsPath.UrlString || null;
//   }

//   static eventStyle(event: SDK.TracingModel.Event): TimelineRecordStyle {
//     const eventStyles = TimelineUIUtils.initEventStyles();
//     if (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.Console) ||
//         event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.UserTiming)) {
//       return new TimelineRecordStyle(event.name, TimelineUIUtils.categories()['scripting']);
//     }

//     if (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.LatencyInfo)) {
//       /** @const */
//       const prefix = 'InputLatency::';
//       const inputEventType = event.name.startsWith(prefix) ? event.name.substr(prefix.length) : event.name;
//       const displayName =
//           TimelineUIUtils.inputEventDisplayName((inputEventType as TimelineModel.TimelineIRModel.InputEvents));
//       return new TimelineRecordStyle(displayName || inputEventType, TimelineUIUtils.categories()['scripting']);
//     }
//     let result: TimelineRecordStyle = eventStyles[event.name];
//     if (!result) {
//       result = new TimelineRecordStyle(event.name, TimelineUIUtils.categories()['other'], true);
//       eventStyles[event.name] = result;
//     }
//     return result;
//   }

//   static eventColor(event: SDK.TracingModel.Event): string {
//     if (event.name === TimelineModel.TimelineModel.RecordType.JSFrame) {
//       const frame = event.args['data'];
//       if (TimelineUIUtils.isUserFrame(frame)) {
//         return TimelineUIUtils.colorForId(frame.url);
//       }
//     }
//     const color = TimelineUIUtils.eventStyle(event).category.color;

//     // This event is considered idle time but still rendered as a scripting event here
//     // to connect the StreamingCompileScriptParsing events it belongs to.
//     if (event.name === TimelineModel.TimelineModel.RecordType.StreamingCompileScriptWaiting) {
//       const color = Common.Color.Color.parse(TimelineUIUtils.categories().scripting.color);
//       if (!color) {
//         throw new Error('Unable to parse color from TimelineUIUtils.categories().scripting.color');
//       }
//       return color.setAlpha(0.3).asString(null) as string;
//     }

//     return color;
//   }

//   static eventColorByProduct(
//       model: TimelineModel.TimelineModel.TimelineModelImpl, urlToColorCache: Map<string, string>,
//       event: SDK.TracingModel.Event): string {
//     const url = TimelineUIUtils.eventURL(event) || Platform.DevToolsPath.EmptyUrlString;
//     let color = urlToColorCache.get(url);
//     if (color) {
//       return color;
//     }
//     const defaultColor = '#f2ecdc';
//     const parsedURL = Common.ParsedURL.ParsedURL.fromString(url);
//     if (!parsedURL) {
//       return defaultColor;
//     }
//     const name = parsedURL.host;
//     const rootFrames = model.rootFrames();
//     if (rootFrames.some(pageFrame => new Common.ParsedURL.ParsedURL(pageFrame.url).host === name)) {
//       color = defaultColor;
//     }
//     if (!color) {
//       color = defaultColor;
//     }
//     urlToColorCache.set(url, color);
//     return color;
//   }

//   static eventTitle(event: SDK.TracingModel.Event): string {
//     const recordType = TimelineModel.TimelineModel.RecordType;
//     const eventData = event.args['data'];
//     if (event.name === recordType.JSFrame) {
//       return TimelineUIUtils.frameDisplayName(eventData);
//     }

//     if (event.name === 'EventTiming' && event.args.data && event.args.data.interactionId) {
//       return i18nString(UIStrings.interactionEvent, {PH1: event.args.data.type, PH2: event.args.data.interactionId});
//     }
//     const title = TimelineUIUtils.eventStyle(event).title;
//     if (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.Console)) {
//       return title;
//     }
//     if (event.name === recordType.TimeStamp) {
//       return i18nString(UIStrings.sS, {PH1: title, PH2: eventData['message']});
//     }
//     if (event.name === recordType.Animation && eventData && eventData['name']) {
//       return i18nString(UIStrings.sS, {PH1: title, PH2: eventData['name']});
//     }
//     if (event.name === recordType.EventDispatch && eventData && eventData['type']) {
//       return i18nString(UIStrings.sS, {PH1: title, PH2: eventData['type']});
//     }
//     return title;
//   }

//   private static interactionPhaseStyles(): Map<TimelineModel.TimelineIRModel.Phases, {
//     color: string,
//     label: string,
//   }> {
//     let map: Map<TimelineModel.TimelineIRModel.Phases, {
//       color: string,
//       label: string,
//     }>|Map<TimelineModel.TimelineIRModel.Phases, {
//       color: string,
//       label: string,
//     }> = interactionPhaseStylesMap;
//     if (!map) {
//       map = new Map([
//         [TimelineModel.TimelineIRModel.Phases.Idle, {color: 'white', label: 'Idle'}],
//         [
//           TimelineModel.TimelineIRModel.Phases.Response,
//           {color: 'hsl(43, 83%, 64%)', label: i18nString(UIStrings.response)},
//         ],
//         [
//           TimelineModel.TimelineIRModel.Phases.Scroll,
//           {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.scroll)},
//         ],
//         [TimelineModel.TimelineIRModel.Phases.Fling, {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.fling)}],
//         [TimelineModel.TimelineIRModel.Phases.Drag, {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.drag)}],
//         [
//           TimelineModel.TimelineIRModel.Phases.Animation,
//           {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.animation)},
//         ],
//         [
//           TimelineModel.TimelineIRModel.Phases.Uncategorized,
//           {color: 'hsl(0, 0%, 87%)', label: i18nString(UIStrings.uncategorized)},
//         ],
//       ]);
//       interactionPhaseStylesMap = map;
//     }
//     return map;
//   }

//   static interactionPhaseColor(phase: TimelineModel.TimelineIRModel.Phases): string {
//     const interactionPhase = TimelineUIUtils.interactionPhaseStyles().get(phase);
//     if (!interactionPhase) {
//       throw new Error(`Unknown phase ${phase}`);
//     }
//     return interactionPhase.color;
//   }

//   static interactionPhaseLabel(phase: TimelineModel.TimelineIRModel.Phases): string {
//     const interactionPhase = TimelineUIUtils.interactionPhaseStyles().get(phase);
//     if (!interactionPhase) {
//       throw new Error(`Unknown phase ${phase}`);
//     }
//     return interactionPhase.label;
//   }

//   static isUserFrame(frame: Protocol.Runtime.CallFrame): boolean {
//     return frame.scriptId !== '0' && !(frame.url && frame.url.startsWith('native '));
//   }

//   static networkRequestCategory(request: TimelineModel.TimelineModel.NetworkRequest): NetworkCategory {
//     const categories = NetworkCategory;
//     switch (request.mimeType) {
//       case 'text/html':
//         return categories.HTML;
//       case 'application/javascript':
//       case 'application/x-javascript':
//       case 'text/javascript':
//         return categories.Script;
//       case 'text/css':
//         return categories.Style;
//       case 'audio/ogg':
//       case 'image/gif':
//       case 'image/jpeg':
//       case 'image/png':
//       case 'image/svg+xml':
//       case 'image/webp':
//       case 'image/x-icon':
//       case 'font/opentype':
//       case 'font/woff2':
//       case 'application/font-woff':
//         return categories.Media;
//       default:
//         return categories.Other;
//     }
//   }

//   static networkCategoryColor(category: NetworkCategory): string {
//     const categories = NetworkCategory;
//     switch (category) {
//       case categories.HTML:
//         return 'hsl(214, 67%, 66%)';
//       case categories.Script:
//         return 'hsl(43, 83%, 64%)';
//       case categories.Style:
//         return 'hsl(256, 67%, 70%)';
//       case categories.Media:
//         return 'hsl(109, 33%, 55%)';
//       default:
//         return 'hsl(0, 0%, 70%)';
//     }
//   }

//   static async buildDetailsTextForTraceEvent(event: SDK.TracingModel.Event): Promise<string|null> {
//     const recordType = TimelineModel.TimelineModel.RecordType;
//     let detailsText;
//     const eventData = event.args['data'];
//     switch (event.name) {
//       case recordType.GCEvent:
//       case recordType.MajorGC:
//       case recordType.MinorGC: {
//         const delta = event.args['usedHeapSizeBefore'] - event.args['usedHeapSizeAfter'];
//         detailsText = i18nString(UIStrings.sCollected, {PH1: Platform.NumberUtilities.bytesToString(delta)});
//         break;
//       }
//       case recordType.FunctionCall:
//         if (eventData && eventData['url'] && eventData['lineNumber'] !== undefined &&
//             eventData['columnNumber'] !== undefined) {
//           detailsText = eventData.url + ':' + (eventData.lineNumber + 1) + ':' + (eventData.columnNumber + 1);
//         }
//         break;
//       case recordType.JSFrame:
//         detailsText = TimelineUIUtils.frameDisplayName(eventData);
//         break;
//       case recordType.EventDispatch:
//         detailsText = eventData ? eventData['type'] : null;
//         break;
//       case recordType.Paint: {
//         const width = TimelineUIUtils.quadWidth(eventData.clip);
//         const height = TimelineUIUtils.quadHeight(eventData.clip);
//         if (width && height) {
//           detailsText = i18nString(UIStrings.sSDimensions, {PH1: width, PH2: height});
//         }
//         break;
//       }
//       case recordType.ParseHTML: {
//         const startLine = event.args['beginData']['startLine'];
//         const endLine = event.args['endData'] && event.args['endData']['endLine'];
//         const url = Bindings.ResourceUtils.displayNameForURL(event.args['beginData']['url']);
//         if (endLine >= 0) {
//           detailsText = i18nString(UIStrings.sSs, {PH1: url, PH2: startLine + 1, PH3: endLine + 1});
//         } else {
//           detailsText = i18nString(UIStrings.sSSquareBrackets, {PH1: url, PH2: startLine + 1});
//         }
//         break;
//       }
//       case recordType.CompileModule:
//       case recordType.CacheModule:
//         detailsText = Bindings.ResourceUtils.displayNameForURL(event.args['fileName']);
//         break;
//       case recordType.CompileScript:
//       case recordType.CacheScript:
//       case recordType.EvaluateScript: {
//         const url = eventData && eventData['url'];
//         if (url) {
//           detailsText = Bindings.ResourceUtils.displayNameForURL(url) + ':' + (eventData['lineNumber'] + 1);
//         }
//         break;
//       }
//       case recordType.WasmCompiledModule:
//       case recordType.WasmModuleCacheHit: {
//         const url = event.args['url'];
//         if (url) {
//           detailsText = Bindings.ResourceUtils.displayNameForURL(url);
//         }
//         break;
//       }

//       case recordType.StreamingCompileScript:
//       case recordType.XHRReadyStateChange:
//       case recordType.XHRLoad: {
//         const url = eventData['url'];
//         if (url) {
//           detailsText = Bindings.ResourceUtils.displayNameForURL(url);
//         }
//         break;
//       }
//       case recordType.TimeStamp:
//         detailsText = eventData['message'];
//         break;

//       case recordType.WebSocketCreate:
//       case recordType.WebSocketSendHandshakeRequest:
//       case recordType.WebSocketReceiveHandshakeResponse:
//       case recordType.WebSocketDestroy:
//       case recordType.ResourceWillSendRequest:
//       case recordType.ResourceSendRequest:
//       case recordType.ResourceReceivedData:
//       case recordType.ResourceReceiveResponse:
//       case recordType.ResourceFinish:
//       case recordType.PaintImage:
//       case recordType.DecodeImage:
//       case recordType.ResizeImage:
//       case recordType.DecodeLazyPixelRef: {
//         const url = TimelineModel.TimelineModel.TimelineData.forEvent(event).url;
//         if (url) {
//           detailsText = Bindings.ResourceUtils.displayNameForURL(url);
//         }
//         break;
//       }

//       case recordType.EmbedderCallback:
//         detailsText = eventData['callbackName'];
//         break;

//       case recordType.Animation:
//         detailsText = eventData && eventData['name'];
//         break;

//       case recordType.AsyncTask:
//         detailsText = eventData ? eventData['name'] : null;
//         break;

//       default:
//         if (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.Console)) {
//           detailsText = null;
//         } else {
//           detailsText = await linkifyTopCallFrameAsText();
//         }
//         break;
//     }

//     return detailsText;

//     async function linkifyTopCallFrameAsText(): Promise<string|null> {
//       const frame = TimelineModel.TimelineModel.TimelineData.forEvent(event).topFrame();
//       if (!frame) {
//         return null;
//       }

//       return frame.url + ':' + (frame.lineNumber + 1) + ':' + (frame.columnNumber + 1);
//     }
//   }

//   static async buildDetailsNodeForTraceEvent(
//       event: SDK.TracingModel.Event, target: SDK.Target.Target|null,
//       linkifier: Components.Linkifier.Linkifier): Promise<Node|null> {
//     const recordType = TimelineModel.TimelineModel.RecordType;
//     let details: HTMLElement|HTMLSpanElement|(Element | null)|Text|null = null;
//     let detailsText;
//     const eventData = event.args['data'];
//     switch (event.name) {
//       case recordType.GCEvent:
//       case recordType.MajorGC:
//       case recordType.MinorGC:
//       case recordType.EventDispatch:
//       case recordType.Paint:
//       case recordType.Animation:
//       case recordType.EmbedderCallback:
//       case recordType.ParseHTML:
//       case recordType.WasmStreamFromResponseCallback:
//       case recordType.WasmCompiledModule:
//       case recordType.WasmModuleCacheHit:
//       case recordType.WasmCachedModule:
//       case recordType.WasmModuleCacheInvalid:
//       case recordType.WebSocketCreate:
//       case recordType.WebSocketSendHandshakeRequest:
//       case recordType.WebSocketReceiveHandshakeResponse:
//       case recordType.WebSocketDestroy: {
//         detailsText = await TimelineUIUtils.buildDetailsTextForTraceEvent(event);
//         break;
//       }

//       case recordType.PaintImage:
//       case recordType.DecodeImage:
//       case recordType.ResizeImage:
//       case recordType.DecodeLazyPixelRef:
//       case recordType.XHRReadyStateChange:
//       case recordType.XHRLoad:
//       case recordType.ResourceWillSendRequest:
//       case recordType.ResourceSendRequest:
//       case recordType.ResourceReceivedData:
//       case recordType.ResourceReceiveResponse:
//       case recordType.ResourceFinish: {
//         const url = TimelineModel.TimelineModel.TimelineData.forEvent(event).url;
//         if (url) {
//           const options = {
//             tabStop: true,
//             showColumnNumber: false,
//             inlineFrameIndex: 0,
//           };
//           details = Components.Linkifier.Linkifier.linkifyURL(url, options);
//         }
//         break;
//       }

//       case recordType.FunctionCall:
//       case recordType.JSFrame: {
//         details = document.createElement('span');
//         UI.UIUtils.createTextChild(details, TimelineUIUtils.frameDisplayName(eventData));
//         const location = linkifyLocation(
//             eventData['scriptId'], eventData['url'], eventData['lineNumber'], eventData['columnNumber']);
//         if (location) {
//           UI.UIUtils.createTextChild(details, ' @ ');
//           details.appendChild(location);
//         }
//         break;
//       }

//       case recordType.CompileModule:
//       case recordType.CacheModule: {
//         details = linkifyLocation(null, event.args['fileName'], 0, 0);
//         break;
//       }

//       case recordType.CompileScript:
//       case recordType.CacheScript:
//       case recordType.EvaluateScript: {
//         const url = eventData['url'];
//         if (url) {
//           details = linkifyLocation(null, url, eventData['lineNumber'], 0);
//         }
//         break;
//       }

//       case recordType.StreamingCompileScript: {
//         const url = eventData['url'];
//         if (url) {
//           details = linkifyLocation(null, url, 0, 0);
//         }
//         break;
//       }

//       default: {
//         if (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.Console)) {
//           detailsText = null;
//         } else {
//           details = linkifyTopCallFrame();
//         }
//         break;
//       }
//     }

//     if (!details && detailsText) {
//       details = document.createTextNode(detailsText);
//     }
//     return details;

//     function linkifyLocation(
//         scriptId: Protocol.Runtime.ScriptId|null, url: string, lineNumber: number, columnNumber?: number): Element|
//         null {
//       const options =
//           {columnNumber, showColumnNumber: true, inlineFrameIndex: 0, className: 'timeline-details', tabStop: true};
//       return linkifier.linkifyScriptLocation(
//           target, scriptId, url as Platform.DevToolsPath.UrlString, lineNumber, options);
//     }

//     function linkifyTopCallFrame(): Element|null {
//       const frame = TimelineModel.TimelineModel.TimelineData.forEvent(event).topFrame();
//       return frame ? linkifier.maybeLinkifyConsoleCallFrame(
//                          target, frame,
//                          {className: 'timeline-details', tabStop: true, inlineFrameIndex: 0, showColumnNumber: true}) :
//                      null;
//     }
//   }

//   static buildDetailsNodeForPerformanceEvent(event: SDK.TracingModel.Event): Element {
//     let link = 'https://web.dev/user-centric-performance-metrics/';
//     let name = 'page performance metrics';
//     const recordType = TimelineModel.TimelineModel.RecordType;
//     switch (event.name) {
//       case recordType.MarkLCPCandidate:
//         link = 'https://web.dev/lcp/';
//         name = 'largest contentful paint';
//         break;
//       case recordType.MarkFCP:
//         link = 'https://web.dev/first-contentful-paint/';
//         name = 'first contentful paint';
//         break;
//       default:
//         break;
//     }

//     return UI.Fragment.html`<div>${UI.XLink.XLink.create(link, i18nString(UIStrings.learnMore))} about ${name}.</div>`;
//   }

//   // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   static buildConsumeCacheDetails(eventData: any, contentHelper: TimelineDetailsContentHelper): void {
//     if ('consumedCacheSize' in eventData) {
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.compilationCacheStatus), i18nString(UIStrings.scriptLoadedFromCache));
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.compilationCacheSize),
//           Platform.NumberUtilities.bytesToString(eventData['consumedCacheSize']));
//     } else if (eventData && 'cacheRejected' in eventData && eventData['cacheRejected']) {
//       // Version mismatch or similar.
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.compilationCacheStatus), i18nString(UIStrings.failedToLoadScriptFromCache));
//     } else {
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.compilationCacheStatus), i18nString(UIStrings.scriptNotEligible));
//     }
//   }

//   static async buildTraceEventDetails(
//       event: SDK.TracingModel.Event, model: TimelineModel.TimelineModel.TimelineModelImpl,
//       linkifier: Components.Linkifier.Linkifier, detailed: boolean): Promise<DocumentFragment> {
//     const maybeTarget = model.targetByEvent(event);
//     let relatedNodesMap: (Map<number, SDK.DOMModel.DOMNode|null>|null)|null = null;
//     if (maybeTarget) {
//       const target = (maybeTarget as SDK.Target.Target);
//       if (typeof event[previewElementSymbol] === 'undefined') {
//         let previewElement: (Element|null)|null = null;
//         const url = TimelineModel.TimelineModel.TimelineData.forEvent(event).url;
//         if (url) {
//           previewElement = await Components.ImagePreview.ImagePreview.build(target, url, false, {
//             imageAltText: Components.ImagePreview.ImagePreview.defaultAltTextForImageURL(url),
//             precomputedFeatures: undefined,
//           });
//         } else if (TimelineModel.TimelineModel.TimelineData.forEvent(event).picture) {
//           previewElement = await TimelineUIUtils.buildPicturePreviewContent(event, target);
//         }
//         event[previewElementSymbol] = previewElement;
//       }

//       const nodeIdsToResolve = new Set<Protocol.DOM.BackendNodeId>();
//       const timelineData = TimelineModel.TimelineModel.TimelineData.forEvent(event);
//       if (timelineData.backendNodeIds) {
//         for (let i = 0; i < timelineData.backendNodeIds.length; ++i) {
//           nodeIdsToResolve.add(timelineData.backendNodeIds[i]);
//         }
//       }
//       const invalidationTrackingEvents = TimelineModel.TimelineModel.InvalidationTracker.invalidationEventsFor(event);
//       if (invalidationTrackingEvents) {
//         TimelineUIUtils.collectInvalidationNodeIds(nodeIdsToResolve, invalidationTrackingEvents);
//       }
//       if (nodeIdsToResolve.size) {
//         const domModel = target.model(SDK.DOMModel.DOMModel);
//         if (domModel) {
//           relatedNodesMap = await domModel.pushNodesByBackendIdsToFrontend(nodeIdsToResolve);
//         }
//       }
//     }

//     const recordTypes = TimelineModel.TimelineModel.RecordType;

//     if (event.name === recordTypes.LayoutShift) {
//       // Ensure that there are no pie charts or extended info for layout shifts.
//       detailed = false;
//     }

//     // This message may vary per event.name;
//     let relatedNodeLabel;

//     const contentHelper = new TimelineDetailsContentHelper(model.targetByEvent(event), linkifier);
//     const color = model.isMarkerEvent(event) ? TimelineUIUtils.markerStyleForEvent(event).color :
//                                                TimelineUIUtils.eventStyle(event).category.color;
//     contentHelper.addSection(TimelineUIUtils.eventTitle(event), color);

//     const eventData = event.args['data'];
//     const timelineData = TimelineModel.TimelineModel.TimelineData.forEvent(event);
//     const initiator = timelineData.initiator();
//     let url: Platform.DevToolsPath.UrlString|null = null;

//     if (timelineData.warning) {
//       contentHelper.appendWarningRow(event);
//     }
//     if (event.name === recordTypes.JSFrame && eventData['deoptReason']) {
//       contentHelper.appendWarningRow(event, TimelineModel.TimelineModel.TimelineModelImpl.WarningType.V8Deopt);
//     }

//     if (detailed && !Number.isNaN(event.duration || 0)) {
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.totalTime), i18n.TimeUtilities.millisToString(event.duration || 0, true));
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.selfTime), i18n.TimeUtilities.millisToString(event.selfTime, true));
//     }

//     if (model.isGenericTrace()) {
//       for (const key in event.args) {
//         try {
//           contentHelper.appendTextRow(key, JSON.stringify(event.args[key]));
//         } catch (e) {
//           contentHelper.appendTextRow(key, `<${typeof event.args[key]}>`);
//         }
//       }
//       return contentHelper.fragment;
//     }

//     switch (event.name) {
//       case recordTypes.GCEvent:
//       case recordTypes.MajorGC:
//       case recordTypes.MinorGC: {
//         const delta = event.args['usedHeapSizeBefore'] - event.args['usedHeapSizeAfter'];
//         contentHelper.appendTextRow(i18nString(UIStrings.collected), Platform.NumberUtilities.bytesToString(delta));
//         break;
//       }

//       case recordTypes.JSFrame:
//       case recordTypes.FunctionCall: {
//         const detailsNode =
//             await TimelineUIUtils.buildDetailsNodeForTraceEvent(event, model.targetByEvent(event), linkifier);
//         if (detailsNode) {
//           contentHelper.appendElementRow(i18nString(UIStrings.function), detailsNode);
//         }
//         break;
//       }

//       case recordTypes.TimerFire:
//       case recordTypes.TimerInstall:
//       case recordTypes.TimerRemove: {
//         contentHelper.appendTextRow(i18nString(UIStrings.timerId), eventData['timerId']);
//         if (event.name === recordTypes.TimerInstall) {
//           contentHelper.appendTextRow(
//               i18nString(UIStrings.timeout), i18n.TimeUtilities.millisToString(eventData['timeout']));
//           contentHelper.appendTextRow(i18nString(UIStrings.repeats), !eventData['singleShot']);
//         }
//         break;
//       }

//       case recordTypes.FireAnimationFrame: {
//         contentHelper.appendTextRow(i18nString(UIStrings.callbackId), eventData['id']);
//         break;
//       }

//       case recordTypes.ResourceWillSendRequest:
//       case recordTypes.ResourceSendRequest:
//       case recordTypes.ResourceReceiveResponse:
//       case recordTypes.ResourceReceivedData:
//       case recordTypes.ResourceFinish: {
//         url = timelineData.url;
//         if (url) {
//           const options = {
//             tabStop: true,
//             showColumnNumber: false,
//             inlineFrameIndex: 0,
//           };
//           contentHelper.appendElementRow(
//               i18nString(UIStrings.resource), Components.Linkifier.Linkifier.linkifyURL(url, options));
//         }
//         if (eventData['requestMethod']) {
//           contentHelper.appendTextRow(i18nString(UIStrings.requestMethod), eventData['requestMethod']);
//         }
//         if (typeof eventData['statusCode'] === 'number') {
//           contentHelper.appendTextRow(i18nString(UIStrings.statusCode), eventData['statusCode']);
//         }
//         if (eventData['mimeType']) {
//           contentHelper.appendTextRow(i18nString(UIStrings.mimeTypeCaps), eventData['mimeType']);
//         }
//         if ('priority' in eventData) {
//           const priority = PerfUI.NetworkPriorities.uiLabelForNetworkPriority(eventData['priority']);
//           contentHelper.appendTextRow(i18nString(UIStrings.priority), priority);
//         }
//         if (eventData['encodedDataLength']) {
//           contentHelper.appendTextRow(
//               i18nString(UIStrings.encodedData), i18nString(UIStrings.sBytes, {n: eventData['encodedDataLength']}));
//         }
//         if (eventData['decodedBodyLength']) {
//           contentHelper.appendTextRow(
//               i18nString(UIStrings.decodedBody), i18nString(UIStrings.sBytes, {n: eventData['decodedBodyLength']}));
//         }
//         break;
//       }

//       case recordTypes.CompileModule: {
//         contentHelper.appendLocationRow(i18nString(UIStrings.module), event.args['fileName'], 0);
//         break;
//       }

//       case recordTypes.CompileScript: {
//         url = eventData && eventData['url'] as Platform.DevToolsPath.UrlString;
//         if (url) {
//           contentHelper.appendLocationRow(
//               i18nString(UIStrings.script), url, eventData['lineNumber'], eventData['columnNumber']);
//         }
//         const isEager = eventData['eager'] ?? false;
//         if (isEager) {
//           contentHelper.appendTextRow(i18nString(UIStrings.eagerCompile), true);
//         }
//         const isStreamed = eventData['streamed'];
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.streamed), isStreamed + (isStreamed ? '' : `: ${eventData['notStreamedReason']}`));
//         TimelineUIUtils.buildConsumeCacheDetails(eventData, contentHelper);
//         break;
//       }

//       case recordTypes.CacheModule: {
//         url = eventData && eventData['url'] as Platform.DevToolsPath.UrlString;
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.compilationCacheSize),
//             Platform.NumberUtilities.bytesToString(eventData['producedCacheSize']));
//         break;
//       }

//       case recordTypes.CacheScript: {
//         url = eventData && eventData['url'] as Platform.DevToolsPath.UrlString;
//         if (url) {
//           contentHelper.appendLocationRow(
//               i18nString(UIStrings.script), url, eventData['lineNumber'], eventData['columnNumber']);
//         }
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.compilationCacheSize),
//             Platform.NumberUtilities.bytesToString(eventData['producedCacheSize']));
//         break;
//       }

//       case recordTypes.EvaluateScript: {
//         url = eventData && eventData['url'] as Platform.DevToolsPath.UrlString;
//         if (url) {
//           contentHelper.appendLocationRow(
//               i18nString(UIStrings.script), url, eventData['lineNumber'], eventData['columnNumber']);
//         }
//         break;
//       }

//       case recordTypes.WasmStreamFromResponseCallback:
//       case recordTypes.WasmCompiledModule:
//       case recordTypes.WasmCachedModule:
//       case recordTypes.WasmModuleCacheHit:
//       case recordTypes.WasmModuleCacheInvalid: {
//         if (eventData) {
//           url = event.args['url'] as Platform.DevToolsPath.UrlString;
//           if (url) {
//             contentHelper.appendTextRow(i18nString(UIStrings.url), url);
//           }
//           const producedCachedSize = event.args['producedCachedSize'];
//           if (producedCachedSize) {
//             contentHelper.appendTextRow(i18nString(UIStrings.producedCacheSize), producedCachedSize);
//           }
//           const consumedCachedSize = event.args['consumedCachedSize'];
//           if (consumedCachedSize) {
//             contentHelper.appendTextRow(i18nString(UIStrings.consumedCacheSize), consumedCachedSize);
//           }
//         }
//         break;
//       }

//       // @ts-ignore Fall-through intended.
//       case recordTypes.Paint: {
//         const clip = eventData['clip'];
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.location), i18nString(UIStrings.sSCurlyBrackets, {PH1: clip[0], PH2: clip[1]}));
//         const clipWidth = TimelineUIUtils.quadWidth(clip);
//         const clipHeight = TimelineUIUtils.quadHeight(clip);
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.dimensions), i18nString(UIStrings.sSDimensions, {PH1: clipWidth, PH2: clipHeight}));
//       }

//       case recordTypes.PaintSetup:
//       case recordTypes.Rasterize:
//       case recordTypes.ScrollLayer: {
//         relatedNodeLabel = i18nString(UIStrings.layerRoot);
//         break;
//       }

//       case recordTypes.PaintImage:
//       case recordTypes.DecodeLazyPixelRef:
//       case recordTypes.DecodeImage:
//       case recordTypes.ResizeImage:
//       case recordTypes.DrawLazyPixelRef: {
//         relatedNodeLabel = i18nString(UIStrings.ownerElement);
//         url = timelineData.url;
//         if (url) {
//           const options = {
//             tabStop: true,
//             showColumnNumber: false,
//             inlineFrameIndex: 0,
//           };
//           contentHelper.appendElementRow(
//               i18nString(UIStrings.imageUrl), Components.Linkifier.Linkifier.linkifyURL(url, options));
//         }
//         break;
//       }

//       case recordTypes.ParseAuthorStyleSheet: {
//         url = eventData['styleSheetUrl'] as Platform.DevToolsPath.UrlString;
//         if (url) {
//           const options = {
//             tabStop: true,
//             showColumnNumber: false,
//             inlineFrameIndex: 0,
//           };
//           contentHelper.appendElementRow(
//               i18nString(UIStrings.stylesheetUrl), Components.Linkifier.Linkifier.linkifyURL(url, options));
//         }
//         break;
//       }

//       case recordTypes.UpdateLayoutTree:  // We don't want to see default details.
//       case recordTypes.RecalculateStyles: {
//         contentHelper.appendTextRow(i18nString(UIStrings.elementsAffected), event.args['elementCount']);
//         break;
//       }

//       case recordTypes.Layout: {
//         const beginData = event.args['beginData'];
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.nodesThatNeedLayout),
//             i18nString(UIStrings.sOfS, {PH1: beginData['dirtyObjects'], PH2: beginData['totalObjects']}));
//         relatedNodeLabel = i18nString(UIStrings.layoutRoot);
//         break;
//       }

//       case recordTypes.ConsoleTime: {
//         contentHelper.appendTextRow(i18nString(UIStrings.message), event.name);
//         break;
//       }

//       case recordTypes.WebSocketCreate:
//       case recordTypes.WebSocketSendHandshakeRequest:
//       case recordTypes.WebSocketReceiveHandshakeResponse:
//       case recordTypes.WebSocketDestroy: {
//         const initiatorData = initiator ? initiator.args['data'] : eventData;
//         if (typeof initiatorData['webSocketURL'] !== 'undefined') {
//           contentHelper.appendTextRow(i18n.i18n.lockedString('URL'), initiatorData['webSocketURL']);
//         }
//         if (typeof initiatorData['webSocketProtocol'] !== 'undefined') {
//           contentHelper.appendTextRow(i18nString(UIStrings.websocketProtocol), initiatorData['webSocketProtocol']);
//         }
//         if (typeof eventData['message'] !== 'undefined') {
//           contentHelper.appendTextRow(i18nString(UIStrings.message), eventData['message']);
//         }
//         break;
//       }

//       case recordTypes.EmbedderCallback: {
//         contentHelper.appendTextRow(i18nString(UIStrings.callbackFunction), eventData['callbackName']);
//         break;
//       }

//       case recordTypes.Animation: {
//         if (event.phase === SDK.TracingModel.Phase.NestableAsyncInstant) {
//           contentHelper.appendTextRow(i18nString(UIStrings.state), eventData['state']);
//         }
//         break;
//       }

//       case recordTypes.ParseHTML: {
//         const beginData = event.args['beginData'];
//         const startLine = beginData['startLine'] - 1;
//         const endLine = event.args['endData'] ? event.args['endData']['endLine'] - 1 : undefined;
//         url = beginData['url'];
//         if (url) {
//           contentHelper.appendLocationRange(i18nString(UIStrings.range), url, startLine, endLine);
//         }
//         break;
//       }

//       // @ts-ignore Fall-through intended.
//       case recordTypes.FireIdleCallback: {
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.allottedTime), i18n.TimeUtilities.millisToString(eventData['allottedMilliseconds']));
//         contentHelper.appendTextRow(i18nString(UIStrings.invokedByTimeout), eventData['timedOut']);
//       }

//       case recordTypes.RequestIdleCallback:
//       case recordTypes.CancelIdleCallback: {
//         contentHelper.appendTextRow(i18nString(UIStrings.callbackId), eventData['id']);
//         break;
//       }

//       case recordTypes.EventDispatch: {
//         contentHelper.appendTextRow(i18nString(UIStrings.type), eventData['type']);
//         break;
//       }

//       // @ts-ignore Fall-through intended.
//       case recordTypes.MarkLCPCandidate: {
//         contentHelper.appendTextRow(i18nString(UIStrings.type), String(eventData['type']));
//         contentHelper.appendTextRow(i18nString(UIStrings.size), String(eventData['size']));
//       }

//       case recordTypes.MarkFirstPaint:
//       case recordTypes.MarkFCP:
//       case recordTypes.MarkLoad:
//       case recordTypes.MarkDOMContent: {
//         let eventTime: number = event.startTime - model.minimumRecordTime();

//         // Find the appropriate navStart based on the navigation ID.
//         const {navigationId} = event.args.data;
//         if (navigationId) {
//           const navStartTime = model.navStartTimes().get(navigationId);

//           if (navStartTime) {
//             eventTime = event.startTime - navStartTime.startTime;
//           }
//         }

//         contentHelper.appendTextRow(
//             i18nString(UIStrings.timestamp), i18n.TimeUtilities.preciseMillisToString(eventTime, 1));
//         contentHelper.appendElementRow(
//             i18nString(UIStrings.details), TimelineUIUtils.buildDetailsNodeForPerformanceEvent(event));
//         break;
//       }

//       case recordTypes.LayoutShift: {
//         const warning = document.createElement('span');
//         const clsLink = UI.XLink.XLink.create('https://web.dev/cls/', i18nString(UIStrings.cumulativeLayoutShifts));
//         const evolvedClsLink =
//             UI.XLink.XLink.create('https://web.dev/evolving-cls/', i18nString(UIStrings.evolvedClsLink));

//         warning.appendChild(
//             i18n.i18n.getFormatLocalizedString(str_, UIStrings.sCLSInformation, {PH1: clsLink, PH2: evolvedClsLink}));
//         contentHelper.appendElementRow(i18nString(UIStrings.warning), warning, true);

//         contentHelper.appendTextRow(i18nString(UIStrings.score), eventData['score'].toPrecision(4));
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.cumulativeScore), eventData['cumulative_score'].toPrecision(4));
//         if ('_current_cluster_id' in eventData) {
//           contentHelper.appendTextRow(i18nString(UIStrings.currentClusterId), eventData['_current_cluster_id']);
//         }
//         if ('_current_cluster_score' in eventData) {
//           contentHelper.appendTextRow(
//               i18nString(UIStrings.currentClusterScore), eventData['_current_cluster_score'].toPrecision(4));
//         }
//         contentHelper.appendTextRow(
//             i18nString(UIStrings.hadRecentInput),
//             eventData['had_recent_input'] ? i18nString(UIStrings.yes) : i18nString(UIStrings.no));

//         for (const impactedNode of eventData['impacted_nodes']) {
//           const oldRect = new CLSRect(impactedNode['old_rect']);
//           const newRect = new CLSRect(impactedNode['new_rect']);

//           const linkedOldRect = await Common.Linkifier.Linkifier.linkify(oldRect);
//           const linkedNewRect = await Common.Linkifier.Linkifier.linkify(newRect);

//           contentHelper.appendElementRow(i18nString(UIStrings.movedFrom), linkedOldRect);
//           contentHelper.appendElementRow(i18nString(UIStrings.movedTo), linkedNewRect);
//         }

//         break;
//       }

//       default: {
//         const detailsNode =
//             await TimelineUIUtils.buildDetailsNodeForTraceEvent(event, model.targetByEvent(event), linkifier);
//         if (detailsNode) {
//           contentHelper.appendElementRow(i18nString(UIStrings.details), detailsNode);
//         }
//         break;
//       }
//     }

//     if (timelineData.timeWaitingForMainThread) {
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.timeWaitingForMainThread),
//           i18n.TimeUtilities.millisToString(timelineData.timeWaitingForMainThread, true));
//     }

//     for (let i = 0; i < timelineData.backendNodeIds.length; ++i) {
//       const relatedNode = relatedNodesMap && relatedNodesMap.get(timelineData.backendNodeIds[i]);
//       if (relatedNode) {
//         const nodeSpan = await Common.Linkifier.Linkifier.linkify(relatedNode);
//         contentHelper.appendElementRow(relatedNodeLabel || i18nString(UIStrings.relatedNode), nodeSpan);
//       }
//     }

//     if (event[previewElementSymbol]) {
//       contentHelper.addSection(i18nString(UIStrings.preview));
//       contentHelper.appendElementRow('', event[previewElementSymbol]);
//     }

//     if (initiator || timelineData.stackTraceForSelfOrInitiator() ||
//         TimelineModel.TimelineModel.InvalidationTracker.invalidationEventsFor(event)) {
//       TimelineUIUtils.generateCauses(event, model.targetByEvent(event), relatedNodesMap, contentHelper);
//     }

//     const stats: {
//       [x: string]: number,
//     } = {};
//     const showPieChart = detailed && TimelineUIUtils.aggregatedStatsForTraceEvent(stats, model, event);
//     if (showPieChart) {
//       contentHelper.addSection(i18nString(UIStrings.aggregatedTime));
//       const pieChart =
//           TimelineUIUtils.generatePieChart(stats, TimelineUIUtils.eventStyle(event).category, event.selfTime);
//       contentHelper.appendElementRow('', pieChart);
//     }

//     return contentHelper.fragment;
//   }

//   static statsForTimeRange(events: SDK.TracingModel.Event[], startTime: number, endTime: number): {
//     [x: string]: number,
//   } {
//     if (!events.length) {
//       return {'idle': endTime - startTime};
//     }

//     buildRangeStatsCacheIfNeeded(events);
//     const aggregatedStats = subtractStats(aggregatedStatsAtTime(endTime), aggregatedStatsAtTime(startTime));
//     const aggregatedTotal = Object.values(aggregatedStats).reduce((a, b) => a + b, 0);
//     aggregatedStats['idle'] = Math.max(0, endTime - startTime - aggregatedTotal);
//     return aggregatedStats;

//     function aggregatedStatsAtTime(time: number): {
//       [x: string]: number,
//     } {
//       const stats: {
//         [x: string]: number,
//       } = {};
//       const cache = events[categoryBreakdownCacheSymbol];
//       for (const category in cache) {
//         const categoryCache = cache[category];
//         const index =
//             Platform.ArrayUtilities.upperBound(categoryCache.time, time, Platform.ArrayUtilities.DEFAULT_COMPARATOR);
//         let value;
//         if (index === 0) {
//           value = 0;
//         } else if (index === categoryCache.time.length) {
//           value = categoryCache.value[categoryCache.value.length - 1];
//         } else {
//           const t0 = categoryCache.time[index - 1];
//           const t1 = categoryCache.time[index];
//           const v0 = categoryCache.value[index - 1];
//           const v1 = categoryCache.value[index];
//           value = v0 + (v1 - v0) * (time - t0) / (t1 - t0);
//         }
//         stats[category] = value;
//       }
//       return stats;
//     }

//     function subtractStats(
//         a: {
//           [x: string]: number,
//         },
//         b: {
//           [x: string]: number,
//         }): {
//       [x: string]: number,
//     } {
//       const result = Object.assign({}, a);
//       for (const key in b) {
//         result[key] -= b[key];
//       }
//       return result;
//     }

//     function buildRangeStatsCacheIfNeeded(events: SDK.TracingModel.Event[]): void {
//       if (events[categoryBreakdownCacheSymbol]) {
//         return;
//       }

//       // aggeregatedStats is a map by categories. For each category there's an array
//       // containing sorted time points which records accumulated value of the category.
//       const aggregatedStats: {
//         [x: string]: {
//           time: number[],
//           value: number[],
//         },
//       } = {};
//       const categoryStack: string[] = [];
//       let lastTime = 0;
//       TimelineModel.TimelineModel.TimelineModelImpl.forEachEvent(
//           events, onStartEvent, onEndEvent, undefined, undefined, undefined, filterForStats());

//       function filterForStats(): (arg0: SDK.TracingModel.Event) => boolean {
//         const visibleEventsFilter = TimelineUIUtils.visibleEventsFilter();
//         return (event: SDK.TracingModel.Event): boolean =>
//                    visibleEventsFilter.accept(event) || SDK.TracingModel.TracingModel.isTopLevelEvent(event);
//       }

//       function updateCategory(category: string, time: number): void {
//         let statsArrays: {
//           time: number[],
//           value: number[],
//         } = aggregatedStats[category];
//         if (!statsArrays) {
//           statsArrays = {time: [], value: []};
//           aggregatedStats[category] = statsArrays;
//         }
//         if (statsArrays.time.length && statsArrays.time[statsArrays.time.length - 1] === time || lastTime > time) {
//           return;
//         }
//         const lastValue = statsArrays.value.length > 0 ? statsArrays.value[statsArrays.value.length - 1] : 0;
//         statsArrays.value.push(lastValue + time - lastTime);
//         statsArrays.time.push(time);
//       }

//       function categoryChange(from: string|null, to: string|null, time: number): void {
//         if (from) {
//           updateCategory(from, time);
//         }
//         lastTime = time;
//         if (to) {
//           updateCategory(to, time);
//         }
//       }

//       function onStartEvent(e: SDK.TracingModel.Event): void {
//         const category = TimelineUIUtils.eventStyle(e).category.name;
//         const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;
//         if (category !== parentCategory) {
//           categoryChange(parentCategory || null, category, e.startTime);
//         }
//         categoryStack.push(category);
//       }

//       function onEndEvent(e: SDK.TracingModel.Event): void {
//         const category = categoryStack.pop();
//         const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;
//         if (category !== parentCategory) {
//           categoryChange(category || null, parentCategory || null, e.endTime || 0);
//         }
//       }

//       const obj = (events as Object);
//       obj[categoryBreakdownCacheSymbol] = aggregatedStats;
//     }
//   }

//   static async buildNetworkRequestDetails(
//       request: TimelineModel.TimelineModel.NetworkRequest, model: TimelineModel.TimelineModel.TimelineModelImpl,
//       linkifier: Components.Linkifier.Linkifier): Promise<DocumentFragment> {
//     const target = model.targetByEvent(request.children[0]);
//     const contentHelper = new TimelineDetailsContentHelper(target, linkifier);
//     const category = TimelineUIUtils.networkRequestCategory(request);
//     const color = TimelineUIUtils.networkCategoryColor(category);
//     contentHelper.addSection(i18nString(UIStrings.networkRequest), color);

//     if (request.url) {
//       const options = {
//         tabStop: true,
//         showColumnNumber: false,
//         inlineFrameIndex: 0,
//       };
//       contentHelper.appendElementRow(
//           i18n.i18n.lockedString('URL'), Components.Linkifier.Linkifier.linkifyURL(request.url, options));
//     }

//     // The time from queueing the request until resource processing is finished.
//     const fullDuration = request.endTime - (request.getStartTime() || -Infinity);
//     if (isFinite(fullDuration)) {
//       let textRow = i18n.TimeUtilities.millisToString(fullDuration, true);
//       // The time from queueing the request until the download is finished. This
//       // corresponds to the total time reported for the request in the network tab.
//       const networkDuration = (request.finishTime || request.getStartTime()) - request.getStartTime();
//       // The time it takes to make the resource available to the renderer process.
//       const processingDuration = request.endTime - (request.finishTime || 0);
//       if (isFinite(networkDuration) && isFinite(processingDuration)) {
//         const networkDurationStr = i18n.TimeUtilities.millisToString(networkDuration, true);
//         const processingDurationStr = i18n.TimeUtilities.millisToString(processingDuration, true);
//         const cacheOrNetworkLabel =
//             request.cached() ? i18nString(UIStrings.loadFromCache) : i18nString(UIStrings.networkTransfer);
//         textRow += i18nString(
//             UIStrings.SSSResourceLoading,
//             {PH1: networkDurationStr, PH2: cacheOrNetworkLabel, PH3: processingDurationStr});
//       }
//       contentHelper.appendTextRow(i18nString(UIStrings.duration), textRow);
//     }

//     if (request.requestMethod) {
//       contentHelper.appendTextRow(i18nString(UIStrings.requestMethod), request.requestMethod);
//     }
//     if (typeof request.priority === 'string') {
//       const priority =
//           PerfUI.NetworkPriorities.uiLabelForNetworkPriority((request.priority as Protocol.Network.ResourcePriority));
//       contentHelper.appendTextRow(i18nString(UIStrings.priority), priority);
//     }
//     if (request.mimeType) {
//       contentHelper.appendTextRow(i18nString(UIStrings.mimeType), request.mimeType);
//     }
//     let lengthText = '';
//     if (request.memoryCached()) {
//       lengthText += i18nString(UIStrings.FromMemoryCache);
//     } else if (request.cached()) {
//       lengthText += i18nString(UIStrings.FromCache);
//     } else if (request.timing && request.timing.pushStart) {
//       lengthText += i18nString(UIStrings.FromPush);
//     }
//     if (request.fromServiceWorker) {
//       lengthText += i18nString(UIStrings.FromServiceWorker);
//     }
//     if (request.encodedDataLength || !lengthText) {
//       lengthText = `${Platform.NumberUtilities.bytesToString(request.encodedDataLength)}${lengthText}`;
//     }
//     contentHelper.appendTextRow(i18nString(UIStrings.encodedData), lengthText);
//     if (request.decodedBodyLength) {
//       contentHelper.appendTextRow(
//           i18nString(UIStrings.decodedBody), Platform.NumberUtilities.bytesToString(request.decodedBodyLength));
//     }
//     const title = i18nString(UIStrings.initiator);
//     const sendRequest = request.children[0];
//     const topFrame = TimelineModel.TimelineModel.TimelineData.forEvent(sendRequest).topFrame();
//     if (topFrame) {
//       const link = linkifier.maybeLinkifyConsoleCallFrame(
//           target, topFrame, {tabStop: true, inlineFrameIndex: 0, showColumnNumber: true});
//       if (link) {
//         contentHelper.appendElementRow(title, link);
//       }
//     } else {
//       const initiator = TimelineModel.TimelineModel.TimelineData.forEvent(sendRequest).initiator();
//       if (initiator) {
//         const initiatorURL = TimelineModel.TimelineModel.TimelineData.forEvent(initiator).url;
//         if (initiatorURL) {
//           const link =
//               linkifier.maybeLinkifyScriptLocation(target, null, initiatorURL, 0, {tabStop: true, inlineFrameIndex: 0});
//           if (link) {
//             contentHelper.appendElementRow(title, link);
//           }
//         }
//       }
//     }

//     if (!requestPreviewElements.get(request) && request.url && target) {
//       const previewElement = (await Components.ImagePreview.ImagePreview.build(target, request.url, false, {
//         imageAltText: Components.ImagePreview.ImagePreview.defaultAltTextForImageURL(request.url),
//         precomputedFeatures: undefined,
//       }) as HTMLImageElement);

//       requestPreviewElements.set(request, previewElement);
//     }

//     const requestPreviewElement = requestPreviewElements.get(request);
//     if (requestPreviewElement) {
//       contentHelper.appendElementRow(i18nString(UIStrings.preview), requestPreviewElement);
//     }
//     return contentHelper.fragment;
//   }

//   static stackTraceFromCallFrames(callFrames: Protocol.Runtime.CallFrame[]): Protocol.Runtime.StackTrace {
//     return {callFrames: callFrames} as Protocol.Runtime.StackTrace;
//   }

//   private static generateCauses(
//       event: SDK.TracingModel.Event, target: SDK.Target.Target|null,
//       relatedNodesMap: Map<number, SDK.DOMModel.DOMNode|null>|null, contentHelper: TimelineDetailsContentHelper): void {
//     const recordTypes = TimelineModel.TimelineModel.RecordType;

//     let callSiteStackLabel;
//     let stackLabel;

//     switch (event.name) {
//       case recordTypes.TimerFire:
//         callSiteStackLabel = i18nString(UIStrings.timerInstalled);
//         break;
//       case recordTypes.FireAnimationFrame:
//         callSiteStackLabel = i18nString(UIStrings.animationFrameRequested);
//         break;
//       case recordTypes.FireIdleCallback:
//         callSiteStackLabel = i18nString(UIStrings.idleCallbackRequested);
//         break;
//       case recordTypes.UpdateLayoutTree:
//       case recordTypes.RecalculateStyles:
//         stackLabel = i18nString(UIStrings.recalculationForced);
//         break;
//       case recordTypes.Layout:
//         callSiteStackLabel = i18nString(UIStrings.firstLayoutInvalidation);
//         stackLabel = i18nString(UIStrings.layoutForced);
//         break;
//     }

//     const timelineData = TimelineModel.TimelineModel.TimelineData.forEvent(event);
//     // Direct cause.
//     if (timelineData.stackTrace && timelineData.stackTrace.length) {
//       contentHelper.addSection(i18nString(UIStrings.callStacks));
//       contentHelper.appendStackTrace(
//           stackLabel || i18nString(UIStrings.stackTrace),
//           TimelineUIUtils.stackTraceFromCallFrames(timelineData.stackTrace));
//     }

//     const initiator = TimelineModel.TimelineModel.TimelineData.forEvent(event).initiator();
//     // Indirect causes.
//     if (TimelineModel.TimelineModel.InvalidationTracker.invalidationEventsFor(event) && target) {
//       // Full invalidation tracking (experimental).
//       contentHelper.addSection(i18nString(UIStrings.invalidations));
//       TimelineUIUtils.generateInvalidations(event, target, relatedNodesMap, contentHelper);
//     } else if (initiator) {  // Partial invalidation tracking.
//       const delay = event.startTime - initiator.startTime;
//       contentHelper.appendTextRow(i18nString(UIStrings.pendingFor), i18n.TimeUtilities.preciseMillisToString(delay, 1));

//       const link = document.createElement('span');
//       link.classList.add('devtools-link');
//       UI.ARIAUtils.markAsLink(link);
//       link.tabIndex = 0;
//       link.textContent = i18nString(UIStrings.reveal);
//       link.addEventListener('click', () => {
//         TimelinePanel.instance().select(TimelineSelection.fromTraceEvent((initiator as SDK.TracingModel.Event)));
//       });
//       link.addEventListener('keydown', event => {
//         if (event.key === 'Enter') {
//           TimelinePanel.instance().select(TimelineSelection.fromTraceEvent((initiator as SDK.TracingModel.Event)));
//           event.consume(true);
//         }
//       });
//       contentHelper.appendElementRow(i18nString(UIStrings.initiator), link);

//       const initiatorStackTrace = TimelineModel.TimelineModel.TimelineData.forEvent(initiator).stackTrace;
//       if (initiatorStackTrace) {
//         contentHelper.appendStackTrace(
//             callSiteStackLabel || i18nString(UIStrings.firstInvalidated),
//             TimelineUIUtils.stackTraceFromCallFrames(initiatorStackTrace));
//       }
//     }
//   }

//   private static generateInvalidations(
//       event: SDK.TracingModel.Event, target: SDK.Target.Target,
//       relatedNodesMap: Map<number, SDK.DOMModel.DOMNode|null>|null, contentHelper: TimelineDetailsContentHelper): void {
//     const invalidationTrackingEvents = TimelineModel.TimelineModel.InvalidationTracker.invalidationEventsFor(event);
//     if (!invalidationTrackingEvents) {
//       return;
//     }

//     const invalidations: {
//       [x: string]: TimelineModel.TimelineModel.InvalidationTrackingEvent[],
//     } = {};
//     for (const invalidation of invalidationTrackingEvents) {
//       if (!invalidations[invalidation.type]) {
//         invalidations[invalidation.type] = [];
//       }
//       invalidations[invalidation.type].push(invalidation);
//     }

//     Object.keys(invalidations).forEach(function(type) {
//       TimelineUIUtils.generateInvalidationsForType(type, target, invalidations[type], relatedNodesMap, contentHelper);
//     });
//   }

//   private static generateInvalidationsForType(
//       type: string, target: SDK.Target.Target, invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[],
//       relatedNodesMap: Map<number, SDK.DOMModel.DOMNode|null>|null, contentHelper: TimelineDetailsContentHelper): void {
//     let title;
//     switch (type) {
//       case TimelineModel.TimelineModel.RecordType.StyleRecalcInvalidationTracking:
//         title = i18nString(UIStrings.styleInvalidations);
//         break;
//       case TimelineModel.TimelineModel.RecordType.LayoutInvalidationTracking:
//         title = i18nString(UIStrings.layoutInvalidations);
//         break;
//       default:
//         title = i18nString(UIStrings.otherInvalidations);
//         break;
//     }

//     const invalidationsTreeOutline = new UI.TreeOutline.TreeOutlineInShadow();
//     invalidationsTreeOutline.registerCSSFiles([invalidationsTreeStyles]);
//     invalidationsTreeOutline.element.classList.add('invalidations-tree');

//     const invalidationGroups = groupInvalidationsByCause(invalidations);
//     invalidationGroups.forEach(function(group) {
//       const groupElement = new InvalidationsGroupElement(target, relatedNodesMap, contentHelper, group);
//       invalidationsTreeOutline.appendChild(groupElement);
//     });
//     contentHelper.appendElementRow(title, invalidationsTreeOutline.element, false, true);

//     function groupInvalidationsByCause(invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[]):
//         TimelineModel.TimelineModel.InvalidationTrackingEvent[][] {
//       const causeToInvalidationMap = new Map<string, TimelineModel.TimelineModel.InvalidationTrackingEvent[]>();
//       for (let index = 0; index < invalidations.length; index++) {
//         const invalidation = invalidations[index];
//         let causeKey = '';
//         if (invalidation.cause.reason) {
//           causeKey += invalidation.cause.reason + '.';
//         }
//         if (invalidation.cause.stackTrace) {
//           invalidation.cause.stackTrace.forEach(function(stackFrame) {
//             causeKey += stackFrame['functionName'] + '.';
//             causeKey += stackFrame['scriptId'] + '.';
//             causeKey += stackFrame['url'] + '.';
//             causeKey += stackFrame['lineNumber'] + '.';
//             causeKey += stackFrame['columnNumber'] + '.';
//           });
//         }

//         const causeToInvalidation = causeToInvalidationMap.get(causeKey);
//         if (causeToInvalidation) {
//           causeToInvalidation.push(invalidation);
//         } else {
//           causeToInvalidationMap.set(causeKey, [invalidation]);
//         }
//       }
//       return [...causeToInvalidationMap.values()];
//     }
//   }

//   private static collectInvalidationNodeIds(
//       nodeIds: Set<number>, invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[]): void {
//     Platform.SetUtilities.addAll(nodeIds, invalidations.map(invalidation => invalidation.nodeId).filter(id => id));
//   }

//   private static aggregatedStatsForTraceEvent(
//       total: {
//         [x: string]: number,
//       },
//       model: TimelineModel.TimelineModel.TimelineModelImpl, event: SDK.TracingModel.Event): boolean {
//     const events = model.inspectedTargetEvents();
//     function eventComparator(startTime: number, e: SDK.TracingModel.Event): number {
//       return startTime - e.startTime;
//     }

//     const index = Platform.ArrayUtilities.binaryIndexOf(events, event.startTime, eventComparator);
//     // Not a main thread event?
//     if (index < 0) {
//       return false;
//     }
//     let hasChildren = false;
//     const endTime = event.endTime;
//     if (endTime) {
//       for (let i = index; i < events.length; i++) {
//         const nextEvent = events[i];
//         if (nextEvent.startTime >= endTime) {
//           break;
//         }
//         if (!nextEvent.selfTime) {
//           continue;
//         }
//         if (nextEvent.thread !== event.thread) {
//           continue;
//         }
//         if (i > index) {
//           hasChildren = true;
//         }
//         const categoryName = TimelineUIUtils.eventStyle(nextEvent).category.name;
//         total[categoryName] = (total[categoryName] || 0) + nextEvent.selfTime;
//       }
//     }
//     if (SDK.TracingModel.TracingModel.isAsyncPhase(event.phase)) {
//       if (event.endTime) {
//         let aggregatedTotal = 0;
//         for (const categoryName in total) {
//           aggregatedTotal += total[categoryName];
//         }
//         total['idle'] = Math.max(0, event.endTime - event.startTime - aggregatedTotal);
//       }
//       return false;
//     }
//     return hasChildren;
//   }

//   static async buildPicturePreviewContent(event: SDK.TracingModel.Event, target: SDK.Target.Target):
//       Promise<Element|null> {
//     const snapshotWithRect =
//         await new TimelineModel.TimelineFrameModel.LayerPaintEvent(event, target).snapshotPromise();
//     if (!snapshotWithRect) {
//       return null;
//     }
//     const imageURLPromise = snapshotWithRect.snapshot.replay();
//     snapshotWithRect.snapshot.release();
//     const imageURL = await imageURLPromise as Platform.DevToolsPath.UrlString;
//     if (!imageURL) {
//       return null;
//     }
//     const stylesContainer = document.createElement('div');
//     const shadowRoot = stylesContainer.attachShadow({mode: 'open'});
//     shadowRoot.adoptedStyleSheets = [imagePreviewStyles];
//     const container = shadowRoot.createChild('div') as HTMLDivElement;
//     container.classList.add('image-preview-container', 'vbox', 'link');
//     const img = (container.createChild('img') as HTMLImageElement);
//     img.src = imageURL;
//     img.alt = Components.ImagePreview.ImagePreview.defaultAltTextForImageURL(imageURL);
//     const paintProfilerButton = container.createChild('a');
//     paintProfilerButton.textContent = i18nString(UIStrings.paintProfiler);
//     UI.ARIAUtils.markAsLink(container);
//     container.tabIndex = 0;
//     container.addEventListener(
//         'click', () => TimelinePanel.instance().select(TimelineSelection.fromTraceEvent(event)), false);
//     container.addEventListener('keydown', keyEvent => {
//       if (keyEvent.key === 'Enter') {
//         TimelinePanel.instance().select(TimelineSelection.fromTraceEvent(event));
//         keyEvent.consume(true);
//       }
//     });
//     return stylesContainer;
//   }

//   static createEventDivider(event: SDK.TracingModel.Event, zeroTime: number): Element {
//     const eventDivider = document.createElement('div');
//     eventDivider.classList.add('resources-event-divider');
//     const startTime = i18n.TimeUtilities.millisToString(event.startTime - zeroTime);
//     UI.Tooltip.Tooltip.install(
//         eventDivider, i18nString(UIStrings.sAtS, {PH1: TimelineUIUtils.eventTitle(event), PH2: startTime}));
//     const style = TimelineUIUtils.markerStyleForEvent(event);
//     if (style.tall) {
//       eventDivider.style.backgroundColor = style.color;
//     }
//     return eventDivider;
//   }

//   private static visibleTypes(): string[] {
//     const eventStyles = TimelineUIUtils.initEventStyles();
//     const result = [];
//     for (const name in eventStyles) {
//       if (!eventStyles[name].hidden) {
//         result.push(name);
//       }
//     }
//     return result;
//   }

//   static visibleEventsFilter(): TimelineModel.TimelineModelFilter.TimelineModelFilter {
//     return new TimelineModel.TimelineModelFilter.TimelineVisibleEventsFilter(TimelineUIUtils.visibleTypes());
//   }

//   static categories(): {
//     [x: string]: TimelineCategory,
//   } {
//     if (categories) {
//       return categories;
//     }
//     categories = {
//       loading: new TimelineCategory(
//           'loading', i18nString(UIStrings.loading), true, 'hsl(214, 67%, 74%)', 'hsl(214, 67%, 66%)'),
//       experience: new TimelineCategory(
//           'experience', i18nString(UIStrings.experience), false, 'hsl(5, 80%, 74%)', 'hsl(5, 80%, 66%)'),
//       scripting: new TimelineCategory(
//           'scripting', i18nString(UIStrings.scripting), true, 'hsl(43, 83%, 72%)', 'hsl(43, 83%, 64%) '),
//       rendering: new TimelineCategory(
//           'rendering', i18nString(UIStrings.rendering), true, 'hsl(256, 67%, 76%)', 'hsl(256, 67%, 70%)'),
//       painting: new TimelineCategory(
//           'painting', i18nString(UIStrings.painting), true, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
//       gpu: new TimelineCategory('gpu', i18nString(UIStrings.gpu), false, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
//       async:
//           new TimelineCategory('async', i18nString(UIStrings.async), false, 'hsl(0, 100%, 50%)', 'hsl(0, 100%, 40%)'),
//       other: new TimelineCategory('other', i18nString(UIStrings.system), false, 'hsl(0, 0%, 87%)', 'hsl(0, 0%, 79%)'),
//       idle: new TimelineCategory('idle', i18nString(UIStrings.idle), false, 'hsl(0, 0%, 98%)', 'hsl(0, 0%, 98%)'),
//     };
//     return categories;
//   }

//   static setCategories(cats: {
//     [x: string]: TimelineCategory,
//   }): void {
//     categories = cats;
//   }

//   static getTimelineMainEventCategories(): string[] {
//     if (eventCategories) {
//       return eventCategories;
//     }
//     eventCategories = ['idle', 'loading', 'painting', 'rendering', 'scripting', 'other'];
//     return eventCategories;
//   }

//   static setTimelineMainEventCategories(categories: string[]): void {
//     eventCategories = categories;
//   }

//   static generatePieChart(
//       aggregatedStats: {
//         [x: string]: number,
//       },
//       selfCategory?: TimelineCategory, selfTime?: number): Element {
//     let total = 0;
//     for (const categoryName in aggregatedStats) {
//       total += aggregatedStats[categoryName];
//     }

//     const element = document.createElement('div');
//     element.classList.add('timeline-details-view-pie-chart-wrapper');
//     element.classList.add('hbox');

//     const pieChart = new PerfUI.PieChart.PieChart();
//     const slices: {
//       value: number,
//       color: string,
//       title: string,
//     }[] = [];

//     function appendLegendRow(name: string, title: string, value: number, color: string): void {
//       if (!value) {
//         return;
//       }
//       slices.push({value, color, title});
//     }

//     // In case of self time, first add self, then children of the same category.
//     if (selfCategory) {
//       if (selfTime) {
//         appendLegendRow(
//             selfCategory.name, i18nString(UIStrings.sSelf, {PH1: selfCategory.title}), selfTime, selfCategory.color);
//       }
//       // Children of the same category.
//       const categoryTime = aggregatedStats[selfCategory.name];
//       const value = categoryTime - (selfTime || 0);
//       if (value > 0) {
//         appendLegendRow(
//             selfCategory.name, i18nString(UIStrings.sChildren, {PH1: selfCategory.title}), value,
//             selfCategory.childColor);
//       }
//     }

//     // Add other categories.
//     for (const categoryName in TimelineUIUtils.categories()) {
//       const category = TimelineUIUtils.categories()[categoryName];
//       if (category === selfCategory) {
//         continue;
//       }
//       appendLegendRow(category.name, category.title, aggregatedStats[category.name], category.childColor);
//     }

//     pieChart.data = {
//       chartName: i18nString(UIStrings.timeSpentInRendering),
//       size: 110,
//       formatter: (value: number): string => i18n.TimeUtilities.preciseMillisToString(value),
//       showLegend: true,
//       total,
//       slices,
//     };
//     const pieChartContainer = element.createChild('div', 'vbox');
//     pieChartContainer.appendChild(pieChart);

//     return element;
//   }

//   static generateDetailsContentForFrame(
//       frame: TimelineModel.TimelineFrameModel.TimelineFrame,
//       filmStripFrame: SDK.FilmStripModel.Frame|null): DocumentFragment {
//     const contentHelper = new TimelineDetailsContentHelper(null, null);
//     contentHelper.addSection(i18nString(UIStrings.frame));

//     const duration = TimelineUIUtils.frameDuration(frame);
//     contentHelper.appendElementRow(i18nString(UIStrings.duration), duration, frame.hasWarnings());
//     contentHelper.appendTextRow(i18nString(UIStrings.cpuTime), i18n.TimeUtilities.millisToString(frame.cpuTime, true));
//     if (filmStripFrame) {
//       const filmStripPreview = document.createElement('div');
//       filmStripPreview.classList.add('timeline-filmstrip-preview');
//       void filmStripFrame.imageDataPromise()
//           .then(data => UI.UIUtils.loadImageFromData(data))
//           .then(image => image && filmStripPreview.appendChild(image));
//       contentHelper.appendElementRow('', filmStripPreview);
//       filmStripPreview.addEventListener('click', frameClicked.bind(null, filmStripFrame), false);
//     }

//     if (frame.layerTree) {
//       contentHelper.appendElementRow(
//           i18nString(UIStrings.layerTree),
//           Components.Linkifier.Linkifier.linkifyRevealable(frame.layerTree, i18nString(UIStrings.show)));
//     }

//     function frameClicked(filmStripFrame: SDK.FilmStripModel.Frame): void {
//       new PerfUI.FilmStripView.Dialog(filmStripFrame, 0);
//     }

//     return contentHelper.fragment;
//   }

//   static frameDuration(frame: TimelineModel.TimelineFrameModel.TimelineFrame): Element {
//     const durationText = i18nString(UIStrings.sAtSParentheses, {
//       PH1: i18n.TimeUtilities.millisToString(frame.endTime - frame.startTime, true),
//       PH2: i18n.TimeUtilities.millisToString(frame.startTimeOffset, true),
//     });
//     if (!frame.hasWarnings()) {
//       return i18n.i18n.getFormatLocalizedString(str_, UIStrings.emptyPlaceholder, {PH1: durationText});
//     }

//     const link = UI.XLink.XLink.create(
//         'https://developers.google.com/web/fundamentals/performance/rendering/', i18nString(UIStrings.jank));
//     return i18n.i18n.getFormatLocalizedString(
//         str_, UIStrings.sLongFrameTimesAreAnIndicationOf, {PH1: durationText, PH2: link});
//   }

//   static createFillStyle(
//       context: CanvasRenderingContext2D, width: number, height: number, color0: string, color1: string,
//       color2: string): CanvasGradient {
//     const gradient = context.createLinearGradient(0, 0, width, height);
//     gradient.addColorStop(0, color0);
//     gradient.addColorStop(0.25, color1);
//     gradient.addColorStop(0.75, color1);
//     gradient.addColorStop(1, color2);
//     return gradient;
//   }

//   static quadWidth(quad: number[]): number {
//     return Math.round(Math.sqrt(Math.pow(quad[0] - quad[2], 2) + Math.pow(quad[1] - quad[3], 2)));
//   }

//   static quadHeight(quad: number[]): number {
//     return Math.round(Math.sqrt(Math.pow(quad[0] - quad[6], 2) + Math.pow(quad[1] - quad[7], 2)));
//   }

//   static eventDispatchDesciptors(): EventDispatchTypeDescriptor[] {
//     if (eventDispatchDesciptors) {
//       return eventDispatchDesciptors;
//     }
//     const lightOrange = 'hsl(40,100%,80%)';
//     const orange = 'hsl(40,100%,50%)';
//     const green = 'hsl(90,100%,40%)';
//     const purple = 'hsl(256,100%,75%)';
//     eventDispatchDesciptors = [
//       new EventDispatchTypeDescriptor(
//           1, lightOrange, ['mousemove', 'mouseenter', 'mouseleave', 'mouseout', 'mouseover']),
//       new EventDispatchTypeDescriptor(
//           1, lightOrange, ['pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'pointermove']),
//       new EventDispatchTypeDescriptor(2, green, ['wheel']),
//       new EventDispatchTypeDescriptor(3, orange, ['click', 'mousedown', 'mouseup']),
//       new EventDispatchTypeDescriptor(3, orange, ['touchstart', 'touchend', 'touchmove', 'touchcancel']),
//       new EventDispatchTypeDescriptor(
//           3, orange, ['pointerdown', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture']),
//       new EventDispatchTypeDescriptor(3, purple, ['keydown', 'keyup', 'keypress']),
//     ];
//     return eventDispatchDesciptors;
//   }

//   static markerShortTitle(event: SDK.TracingModel.Event): string|null {
//     const recordTypes = TimelineModel.TimelineModel.RecordType;
//     switch (event.name) {
//       case recordTypes.MarkDOMContent:
//         return i18n.i18n.lockedString('DCL');
//       case recordTypes.MarkLoad:
//         return i18n.i18n.lockedString('L');
//       case recordTypes.MarkFirstPaint:
//         return i18n.i18n.lockedString('FP');
//       case recordTypes.MarkFCP:
//         return i18n.i18n.lockedString('FCP');
//       case recordTypes.MarkLCPCandidate:
//         return i18n.i18n.lockedString('LCP');
//     }
//     return null;
//   }

//   static markerStyleForEvent(event: SDK.TracingModel.Event): TimelineMarkerStyle {
//     const tallMarkerDashStyle = [6, 4];
//     const title = TimelineUIUtils.eventTitle(event);
//     const recordTypes = TimelineModel.TimelineModel.RecordType;

//     if (event.name !== recordTypes.NavigationStart &&
//         (event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.Console) ||
//          event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.UserTiming))) {
//       return {
//         title: title,
//         dashStyle: tallMarkerDashStyle,
//         lineWidth: 0.5,
//         color: event.hasCategory(TimelineModel.TimelineModel.TimelineModelImpl.Category.UserTiming) ? 'purple' :
//                                                                                                       'orange',
//         tall: false,
//         lowPriority: false,
//       };
//     }
//     let tall = false;
//     let color = 'grey';
//     switch (event.name) {
//       case recordTypes.NavigationStart:
//         color = '#FF9800';
//         tall = true;
//         break;
//       case recordTypes.FrameStartedLoading:
//         color = 'green';
//         tall = true;
//         break;
//       case recordTypes.MarkDOMContent:
//         color = '#0867CB';
//         tall = true;
//         break;
//       case recordTypes.MarkLoad:
//         color = '#B31412';
//         tall = true;
//         break;
//       case recordTypes.MarkFirstPaint:
//         color = '#228847';
//         tall = true;
//         break;
//       case recordTypes.MarkFCP:
//         color = '#1A6937';
//         tall = true;
//         break;
//       case recordTypes.MarkLCPCandidate:
//         color = '#1A3422';
//         tall = true;
//         break;
//       case recordTypes.TimeStamp:
//         color = 'orange';
//         break;
//     }
//     return {
//       title: title,
//       dashStyle: tallMarkerDashStyle,
//       lineWidth: 0.5,
//       color: color,
//       tall: tall,
//       lowPriority: false,
//     };
//   }

//   static markerStyleForFrame(): TimelineMarkerStyle {
//     return {
//       title: i18nString(UIStrings.frame),
//       color: 'rgba(100, 100, 100, 0.4)',
//       lineWidth: 3,
//       dashStyle: [3],
//       tall: true,
//       lowPriority: true,
//     };
//   }

//   static colorForId(id: string): string {
//     if (!colorGenerator) {
//       colorGenerator =
//           new Common.Color.Generator({min: 30, max: 330, count: undefined}, {min: 50, max: 80, count: 3}, 85);
//       colorGenerator.setColorForID('', '#f2ecdc');
//     }
//     return colorGenerator.colorForID(id);
//   }

//   static eventWarning(event: SDK.TracingModel.Event, warningType?: string): Element|null {
//     const timelineData = TimelineModel.TimelineModel.TimelineData.forEvent(event);
//     const warning = warningType || timelineData.warning;
//     if (!warning) {
//       return null;
//     }
//     const warnings = TimelineModel.TimelineModel.TimelineModelImpl.WarningType;
//     const span = document.createElement('span');
//     const eventData = event.args['data'];

//     switch (warning) {
//       case warnings.ForcedStyle:
//       case warnings.ForcedLayout: {
//         const forcedReflowLink = UI.XLink.XLink.create(
//             'https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts',
//             i18nString(UIStrings.forcedReflow));
//         span.appendChild(i18n.i18n.getFormatLocalizedString(
//             str_, UIStrings.sIsALikelyPerformanceBottleneck, {PH1: forcedReflowLink}));
//         break;
//       }

//       case warnings.IdleDeadlineExceeded: {
//         const exceededMs =
//             i18n.TimeUtilities.millisToString((event.duration || 0) - eventData['allottedMilliseconds'], true);
//         span.textContent = i18nString(UIStrings.idleCallbackExecutionExtended, {PH1: exceededMs});
//         break;
//       }

//       case warnings.LongHandler: {
//         span.textContent =
//             i18nString(UIStrings.handlerTookS, {PH1: i18n.TimeUtilities.millisToString((event.duration || 0), true)});
//         break;
//       }

//       case warnings.LongRecurringHandler: {
//         span.textContent = i18nString(
//             UIStrings.recurringHandlerTookS, {PH1: i18n.TimeUtilities.millisToString((event.duration || 0), true)});
//         break;
//       }

//       case warnings.LongTask: {
//         const longTaskLink =
//             UI.XLink.XLink.create('https://web.dev/rail/#goals-and-guidelines', i18nString(UIStrings.longTask));
//         span.appendChild(i18n.i18n.getFormatLocalizedString(
//             str_, UIStrings.sTookS,
//             {PH1: longTaskLink, PH2: i18n.TimeUtilities.millisToString((event.duration || 0), true)}));
//         break;
//       }

//       case warnings.V8Deopt: {
//         span.appendChild(UI.XLink.XLink.create(
//             'https://github.com/GoogleChrome/devtools-docs/issues/53', i18nString(UIStrings.notOptimized)));
//         UI.UIUtils.createTextChild(span, i18nString(UIStrings.emptyPlaceholderColon, {PH1: eventData['deoptReason']}));
//         break;
//       }

//       default: {
//         console.assert(false, 'Unhandled TimelineModel.WarningType');
//       }
//     }
//     return span;
//   }

//   // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   static displayNameForFrame(frame: TimelineModel.TimelineModel.PageFrame, trimAt?: number): any {
//     const url = frame.url;
//     if (!trimAt) {
//       trimAt = 30;
//     }
//     return url.startsWith('about:') ? `"${Platform.StringUtilities.trimMiddle(frame.name, trimAt)}"` :
//                                       frame.url.trimEnd(trimAt);
//   }
// }

export class TimelineRecordStyle {
  title: string;
  category: TimelineCategory;
  hidden: boolean;

  constructor(
    title: string,
    category: TimelineCategory,
    hidden: boolean | undefined = false,
  ) {
    this.title = title;
    this.category = category;
    this.hidden = hidden;
  }
}

// // TODO(crbug.com/1167717): Make this a const enum again
// // eslint-disable-next-line rulesdir/const_enum
// export enum NetworkCategory {
//   HTML = 'HTML',
//   Script = 'Script',
//   Style = 'Style',
//   Media = 'Media',
//   Other = 'Other',
// }

// export const aggregatedStatsKey = Symbol('aggregatedStats');

// export class InvalidationsGroupElement extends UI.TreeOutline.TreeElement {
//   toggleOnClick: boolean;
//   private readonly relatedNodesMap: Map<number, SDK.DOMModel.DOMNode|null>|null;
//   private readonly contentHelper: TimelineDetailsContentHelper;
//   private readonly invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[];

//   constructor(
//       target: SDK.Target.Target, relatedNodesMap: Map<number, SDK.DOMModel.DOMNode|null>|null,
//       contentHelper: TimelineDetailsContentHelper,
//       invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[]) {
//     super('', true);

//     this.listItemElement.classList.add('header');
//     this.selectable = false;
//     this.toggleOnClick = true;

//     this.relatedNodesMap = relatedNodesMap;
//     this.contentHelper = contentHelper;
//     this.invalidations = invalidations;
//     this.title = this.createTitle(target);
//   }

//   private createTitle(target: SDK.Target.Target): Element {
//     const first = this.invalidations[0];
//     const reason = first.cause.reason || i18nString(UIStrings.unknownCause);
//     const topFrame = first.cause.stackTrace && first.cause.stackTrace[0];

//     const truncatedNodesElement = this.getTruncatedNodesElement(this.invalidations);
//     if (truncatedNodesElement === null) {
//       return i18n.i18n.getFormatLocalizedString(str_, UIStrings.emptyPlaceholder, {PH1: reason});
//     }

//     const title = i18n.i18n.getFormatLocalizedString(str_, UIStrings.sForS, {PH1: reason, PH2: truncatedNodesElement});

//     if (topFrame && this.contentHelper.linkifier()) {
//       const stack = document.createElement('span');
//       stack.classList.add('monospace');
//       const completeTitle = i18n.i18n.getFormatLocalizedString(str_, UIStrings.sSDot, {PH1: title, PH2: stack});
//       stack.createChild('span').textContent = TimelineUIUtils.frameDisplayName(topFrame);
//       const linkifier = this.contentHelper.linkifier();
//       if (linkifier) {
//         const link =
//             linkifier.maybeLinkifyConsoleCallFrame(target, topFrame, {showColumnNumber: true, inlineFrameIndex: 0});
//         if (link) {
//           // Linkifier is using a workaround with the 'zero width space' (\u200b).
//           // TODO(szuend): Remove once the Linkifier is no longer using the workaround.
//           if (!link.textContent || link.textContent === '\u200b') {
//             link.textContent = i18nString(UIStrings.unknown);
//           }
//           stack.createChild('span').textContent = ' @ ';
//           stack.createChild('span').appendChild(link);
//         }
//       }
//       return completeTitle;
//     }

//     return title;
//   }

//   async onpopulate(): Promise<void> {
//     const content = document.createElement('div');
//     content.classList.add('content');

//     const first = this.invalidations[0];
//     if (first.cause.stackTrace) {
//       const stack = content.createChild('div');
//       UI.UIUtils.createTextChild(stack, i18nString(UIStrings.stackTraceColon));
//       this.contentHelper.createChildStackTraceElement(
//           stack, TimelineUIUtils.stackTraceFromCallFrames(first.cause.stackTrace));
//     }

//     UI.UIUtils.createTextChild(
//         content, this.invalidations.length !== 1 ? i18nString(UIStrings.nodes) : i18nString(UIStrings.node));
//     const nodeList = content.createChild('div', 'node-list');
//     let firstNode = true;
//     for (let i = 0; i < this.invalidations.length; i++) {
//       const invalidation = this.invalidations[i];
//       const invalidationNode = this.createInvalidationNode(invalidation, true);
//       if (invalidationNode) {
//         if (!firstNode) {
//           UI.UIUtils.createTextChild(nodeList, ', ');
//         }
//         firstNode = false;

//         nodeList.appendChild(invalidationNode);

//         const extraData = invalidation.extraData ? ', ' + invalidation.extraData : '';
//         if (invalidation.changedId) {
//           UI.UIUtils.createTextChild(
//               nodeList, i18nString(UIStrings.changedIdToSs, {PH1: invalidation.changedId, PH2: extraData}));
//         } else if (invalidation.changedClass) {
//           UI.UIUtils.createTextChild(
//               nodeList, i18nString(UIStrings.changedClassToSs, {PH1: invalidation.changedClass, PH2: extraData}));
//         } else if (invalidation.changedAttribute) {
//           UI.UIUtils.createTextChild(
//               nodeList,
//               i18nString(UIStrings.changedAttributeToSs, {PH1: invalidation.changedAttribute, PH2: extraData}));
//         } else if (invalidation.changedPseudo) {
//           UI.UIUtils.createTextChild(
//               nodeList, i18nString(UIStrings.changedPesudoToSs, {PH1: invalidation.changedPseudo, PH2: extraData}));
//         } else if (invalidation.selectorPart) {
//           UI.UIUtils.createTextChild(
//               nodeList, i18nString(UIStrings.changedSs, {PH1: invalidation.selectorPart, extraData}));
//         }
//       }
//     }

//     const contentTreeElement = new UI.TreeOutline.TreeElement(content, false);
//     contentTreeElement.selectable = false;
//     this.appendChild(contentTreeElement);
//   }

//   private getTruncatedNodesElement(invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[]): Element
//       |null {
//     const invalidationNodes = [];
//     const invalidationNodeIdMap: {
//       [x: number]: boolean,
//     } = {};
//     for (let i = 0; i < invalidations.length; i++) {
//       const invalidation = invalidations[i];
//       const invalidationNode = this.createInvalidationNode(invalidation, false);
//       invalidationNode.addEventListener(
//           'click',

//           (evt: Event) => evt.consume(), false);
//       if (invalidationNode && invalidation.nodeId && !invalidationNodeIdMap[invalidation.nodeId]) {
//         invalidationNodes.push(invalidationNode);
//         invalidationNodeIdMap[invalidation.nodeId] = true;
//       }
//     }

//     if (invalidationNodes.length === 1) {
//       const node = invalidationNodes[0];
//       if (node instanceof HTMLSpanElement) {
//         return node;
//       }

//       return null;
//     }
//     if (invalidationNodes.length === 2) {
//       return i18n.i18n.getFormatLocalizedString(
//           str_, UIStrings.sAndS, {PH1: invalidationNodes[0], PH2: invalidationNodes[1]});
//     }
//     if (invalidationNodes.length === 3) {
//       return i18n.i18n.getFormatLocalizedString(
//           str_, UIStrings.sAndSOther, {PH1: invalidationNodes[0], PH2: invalidationNodes[1]});
//     }
//     if (invalidationNodes.length >= 4) {
//       return i18n.i18n.getFormatLocalizedString(
//           str_, UIStrings.sSAndSOthers,
//           {PH1: invalidationNodes[0], PH2: invalidationNodes[1], PH3: String(invalidationNodes.length - 2)});
//     }
//     return null;
//   }

//   private createInvalidationNode(
//       invalidation: TimelineModel.TimelineModel.InvalidationTrackingEvent, showUnknownNodes: boolean): HTMLSpanElement
//       |Text {
//     const node = (invalidation.nodeId && this.relatedNodesMap) ? this.relatedNodesMap.get(invalidation.nodeId) : null;
//     if (node) {
//       const nodeSpan = document.createElement('span');
//       void Common.Linkifier.Linkifier.linkify(node).then(link => nodeSpan.appendChild(link));
//       return nodeSpan;
//     }
//     if (invalidation.nodeName) {
//       const nodeSpan = document.createElement('span');
//       nodeSpan.textContent = invalidation.nodeName;
//       return nodeSpan;
//     }
//     if (showUnknownNodes) {
//       const nodeSpan = document.createElement('span');
//       return UI.UIUtils.createTextChild(nodeSpan, i18nString(UIStrings.UnknownNode));
//     }

//     throw new Error('Unable to create invalidation node');
//   }
// }

// export const previewElementSymbol = Symbol('previewElement');

// export class EventDispatchTypeDescriptor {
//   priority: number;
//   color: string;
//   eventTypes: string[];

//   constructor(priority: number, color: string, eventTypes: string[]) {
//     this.priority = priority;
//     this.color = color;
//     this.eventTypes = eventTypes;
//   }
// }

export class TimelineCategory {
  name: string;
  title: string;
  visible: boolean;
  childColor: string;
  color: string;
  private hiddenInternal?: boolean;

  constructor(
    name: string,
    title: string,
    visible: boolean,
    childColor: string,
    color: string,
  ) {
    this.name = name;
    this.title = title;
    this.visible = visible;
    this.childColor = childColor;
    this.color = color;
    this.hidden = false;
  }

  get hidden(): boolean {
    return Boolean(this.hiddenInternal);
  }

  set hidden(hidden: boolean) {
    this.hiddenInternal = hidden;
  }
}

// export class TimelineDetailsContentHelper {
//   fragment: DocumentFragment;
//   private linkifierInternal: Components.Linkifier.Linkifier|null;
//   private target: SDK.Target.Target|null;
//   element: HTMLDivElement;
//   private tableElement: HTMLElement;

//   constructor(target: SDK.Target.Target|null, linkifier: Components.Linkifier.Linkifier|null) {
//     this.fragment = document.createDocumentFragment();

//     this.linkifierInternal = linkifier;
//     this.target = target;

//     this.element = document.createElement('div');
//     this.element.classList.add('timeline-details-view-block');
//     this.tableElement = this.element.createChild('div', 'vbox timeline-details-chip-body');
//     this.fragment.appendChild(this.element);
//   }

//   addSection(title: string, swatchColor?: string): void {
//     if (!this.tableElement.hasChildNodes()) {
//       this.element.removeChildren();
//     } else {
//       this.element = document.createElement('div');
//       this.element.classList.add('timeline-details-view-block');
//       this.fragment.appendChild(this.element);
//     }

//     if (title) {
//       const titleElement = this.element.createChild('div', 'timeline-details-chip-title');
//       if (swatchColor) {
//         titleElement.createChild('div').style.backgroundColor = swatchColor;
//       }
//       UI.UIUtils.createTextChild(titleElement, title);
//     }

//     this.tableElement = this.element.createChild('div', 'vbox timeline-details-chip-body');
//     this.fragment.appendChild(this.element);
//   }

//   linkifier(): Components.Linkifier.Linkifier|null {
//     return this.linkifierInternal;
//   }

//   appendTextRow(title: string, value: string|number|boolean): void {
//     const rowElement = this.tableElement.createChild('div', 'timeline-details-view-row');
//     rowElement.createChild('div', 'timeline-details-view-row-title').textContent = title;
//     rowElement.createChild('div', 'timeline-details-view-row-value').textContent = value.toString();
//   }

//   appendElementRow(title: string, content: string|Node, isWarning?: boolean, isStacked?: boolean): void {
//     const rowElement = this.tableElement.createChild('div', 'timeline-details-view-row');
//     if (isWarning) {
//       rowElement.classList.add('timeline-details-warning');
//     }
//     if (isStacked) {
//       rowElement.classList.add('timeline-details-stack-values');
//     }
//     const titleElement = rowElement.createChild('div', 'timeline-details-view-row-title');
//     titleElement.textContent = title;
//     const valueElement = rowElement.createChild('div', 'timeline-details-view-row-value');
//     if (content instanceof Node) {
//       valueElement.appendChild(content);
//     } else {
//       UI.UIUtils.createTextChild(valueElement, content || '');
//     }
//   }

//   appendLocationRow(title: string, url: string, startLine: number, startColumn?: number): void {
//     if (!this.linkifierInternal || !this.target) {
//       return;
//     }

//     const options = {
//       tabStop: true,
//       columnNumber: startColumn,
//       showColumnNumber: true,
//       inlineFrameIndex: 0,
//     };
//     const link = this.linkifierInternal.maybeLinkifyScriptLocation(
//         this.target, null, url as Platform.DevToolsPath.UrlString, startLine, options);
//     if (!link) {
//       return;
//     }
//     this.appendElementRow(title, link);
//   }

//   appendLocationRange(title: string, url: Platform.DevToolsPath.UrlString, startLine: number, endLine?: number): void {
//     if (!this.linkifierInternal || !this.target) {
//       return;
//     }
//     const locationContent = document.createElement('span');
//     const link = this.linkifierInternal.maybeLinkifyScriptLocation(
//         this.target, null, url, startLine, {tabStop: true, inlineFrameIndex: 0});
//     if (!link) {
//       return;
//     }
//     locationContent.appendChild(link);
//     UI.UIUtils.createTextChild(
//         locationContent, Platform.StringUtilities.sprintf(' [%s…%s]', startLine + 1, (endLine || 0) + 1 || ''));
//     this.appendElementRow(title, locationContent);
//   }

//   appendStackTrace(title: string, stackTrace: Protocol.Runtime.StackTrace): void {
//     if (!this.linkifierInternal || !this.target) {
//       return;
//     }

//     const rowElement = this.tableElement.createChild('div', 'timeline-details-view-row');
//     rowElement.createChild('div', 'timeline-details-view-row-title').textContent = title;
//     this.createChildStackTraceElement(rowElement, stackTrace);
//   }

//   createChildStackTraceElement(parentElement: Element, stackTrace: Protocol.Runtime.StackTrace): void {
//     if (!this.linkifierInternal || !this.target) {
//       return;
//     }
//     parentElement.classList.add('timeline-details-stack-values');
//     const stackTraceElement =
//         parentElement.createChild('div', 'timeline-details-view-row-value timeline-details-view-row-stack-trace');
//     const callFrameContents = Components.JSPresentationUtils.buildStackTracePreviewContents(
//         this.target, this.linkifierInternal, {stackTrace, tabStops: true});
//     stackTraceElement.appendChild(callFrameContents.element);
//   }

//   appendWarningRow(event: SDK.TracingModel.Event, warningType?: string): void {
//     const warning = TimelineUIUtils.eventWarning(event, warningType);
//     if (warning) {
//       this.appendElementRow(i18nString(UIStrings.warning), warning, true);
//     }
//   }
// }

// export const categoryBreakdownCacheSymbol = Symbol('categoryBreakdownCache');
// export interface TimelineMarkerStyle {
//   title: string;
//   color: string;
//   lineWidth: number;
//   dashStyle: number[];
//   tall: boolean;
//   lowPriority: boolean;
// }

// export function assignLayoutShiftsToClusters(layoutShifts: readonly SDK.TracingModel.Event[]): void {
//   const gapTimeInMs = 1000;
//   const limitTimeInMs = 5000;
//   let firstTimestamp = Number.NEGATIVE_INFINITY;
//   let previousTimestamp = Number.NEGATIVE_INFINITY;
//   let currentClusterId = 0;
//   let currentClusterScore = 0;
//   let currentCluster = new Set<SDK.TracingModel.Event>();

//   for (const event of layoutShifts) {
//     if (event.args['data']['had_recent_input'] || event.args['data']['weighted_score_delta'] === undefined) {
//       continue;
//     }

//     if (event.startTime - firstTimestamp > limitTimeInMs || event.startTime - previousTimestamp > gapTimeInMs) {
//       // This means the event does not fit into the current session/cluster, so we need to start a new cluster.
//       firstTimestamp = event.startTime;

//       // Update all the layout shifts we found in this cluster to associate them with the cluster.
//       for (const layoutShift of currentCluster) {
//         layoutShift.args['data']['_current_cluster_score'] = currentClusterScore;
//         layoutShift.args['data']['_current_cluster_id'] = currentClusterId;
//       }

//       // Increment the cluster ID and reset the data.
//       currentClusterId += 1;
//       currentClusterScore = 0;
//       currentCluster = new Set();
//     }

//     // Store the timestamp of the previous layout shift.
//     previousTimestamp = event.startTime;
//     // Update the score of the current cluster and store this event in that cluster
//     currentClusterScore += event.args['data']['weighted_score_delta'];
//     currentCluster.add(event);
//   }

//   // The last cluster we find may not get closed out - so if not, update all the shifts that we associate with it.
//   for (const layoutShift of currentCluster) {
//     layoutShift.args['data']['_current_cluster_score'] = currentClusterScore;
//     layoutShift.args['data']['_current_cluster_id'] = currentClusterId;
//   }
// }
import * as ArrayUtilities from "./array-utilitties";
import { TimelineModelImpl } from "./TimelineModel";
import { TimelineVisibleEventsFilter } from "./TimeLineModelFilter";
import { Event, TracingModel } from "./TracingModel";

export const categoryBreakdownCacheSymbol = Symbol("categoryBreakdownCache");
interface EventStylesMap {
  [x: string]: TimelineRecordStyle;
}
let eventStylesMap: EventStylesMap;
export enum RecordType {
  Task = "RunTask",
  Program = "Program",
  EventDispatch = "EventDispatch",

  GPUTask = "GPUTask",

  Animation = "Animation",
  RequestMainThreadFrame = "RequestMainThreadFrame",
  BeginFrame = "BeginFrame",
  NeedsBeginFrameChanged = "NeedsBeginFrameChanged",
  BeginMainThreadFrame = "BeginMainThreadFrame",
  ActivateLayerTree = "ActivateLayerTree",
  DrawFrame = "DrawFrame",
  DroppedFrame = "DroppedFrame",
  HitTest = "HitTest",
  ScheduleStyleRecalculation = "ScheduleStyleRecalculation",
  RecalculateStyles = "RecalculateStyles",
  UpdateLayoutTree = "UpdateLayoutTree",
  InvalidateLayout = "InvalidateLayout",
  Layout = "Layout",
  LayoutShift = "LayoutShift",
  UpdateLayer = "UpdateLayer",
  UpdateLayerTree = "UpdateLayerTree",
  PaintSetup = "PaintSetup",
  Paint = "Paint",
  PaintImage = "PaintImage",
  PrePaint = "PrePaint",
  Rasterize = "Rasterize",
  RasterTask = "RasterTask",
  ScrollLayer = "ScrollLayer",
  CompositeLayers = "CompositeLayers",
  ComputeIntersections = "IntersectionObserverController::computeIntersections",
  InteractiveTime = "InteractiveTime",

  ScheduleStyleInvalidationTracking = "ScheduleStyleInvalidationTracking",
  StyleRecalcInvalidationTracking = "StyleRecalcInvalidationTracking",
  StyleInvalidatorInvalidationTracking = "StyleInvalidatorInvalidationTracking",
  LayoutInvalidationTracking = "LayoutInvalidationTracking",

  ParseHTML = "ParseHTML",
  ParseAuthorStyleSheet = "ParseAuthorStyleSheet",

  TimerInstall = "TimerInstall",
  TimerRemove = "TimerRemove",
  TimerFire = "TimerFire",

  XHRReadyStateChange = "XHRReadyStateChange",
  XHRLoad = "XHRLoad",
  CompileScript = "v8.compile",
  CompileCode = "V8.CompileCode",
  OptimizeCode = "V8.OptimizeCode",
  EvaluateScript = "EvaluateScript",
  CacheScript = "v8.produceCache",
  CompileModule = "v8.compileModule",
  EvaluateModule = "v8.evaluateModule",
  CacheModule = "v8.produceModuleCache",
  WasmStreamFromResponseCallback = "v8.wasm.streamFromResponseCallback",
  WasmCompiledModule = "v8.wasm.compiledModule",
  WasmCachedModule = "v8.wasm.cachedModule",
  WasmModuleCacheHit = "v8.wasm.moduleCacheHit",
  WasmModuleCacheInvalid = "v8.wasm.moduleCacheInvalid",

  FrameStartedLoading = "FrameStartedLoading",
  CommitLoad = "CommitLoad",
  MarkLoad = "MarkLoad",
  MarkDOMContent = "MarkDOMContent",
  MarkFirstPaint = "firstPaint",
  MarkFCP = "firstContentfulPaint",
  MarkLCPCandidate = "largestContentfulPaint::Candidate",
  MarkLCPInvalidate = "largestContentfulPaint::Invalidate",
  NavigationStart = "navigationStart",

  TimeStamp = "TimeStamp",
  ConsoleTime = "ConsoleTime",
  UserTiming = "UserTiming",
  EventTiming = "EventTiming",

  ResourceWillSendRequest = "ResourceWillSendRequest",
  ResourceSendRequest = "ResourceSendRequest",
  ResourceReceiveResponse = "ResourceReceiveResponse",
  ResourceReceivedData = "ResourceReceivedData",
  ResourceFinish = "ResourceFinish",
  ResourceMarkAsCached = "ResourceMarkAsCached",

  RunMicrotasks = "RunMicrotasks",
  FunctionCall = "FunctionCall",
  GCEvent = "GCEvent",
  MajorGC = "MajorGC",
  MinorGC = "MinorGC",
  JSFrame = "JSFrame",
  JSSample = "JSSample",
  // V8Sample events are coming from tracing and contain raw stacks with function addresses.
  // After being processed with help of JitCodeAdded and JitCodeMoved events they
  // get translated into function infos and stored as stacks in JSSample events.
  V8Sample = "V8Sample",
  JitCodeAdded = "JitCodeAdded",
  JitCodeMoved = "JitCodeMoved",
  StreamingCompileScript = "v8.parseOnBackground",
  StreamingCompileScriptWaiting = "v8.parseOnBackgroundWaiting",
  StreamingCompileScriptParsing = "v8.parseOnBackgroundParsing",
  V8Execute = "V8.Execute",

  UpdateCounters = "UpdateCounters",

  RequestAnimationFrame = "RequestAnimationFrame",
  CancelAnimationFrame = "CancelAnimationFrame",
  FireAnimationFrame = "FireAnimationFrame",

  RequestIdleCallback = "RequestIdleCallback",
  CancelIdleCallback = "CancelIdleCallback",
  FireIdleCallback = "FireIdleCallback",

  WebSocketCreate = "WebSocketCreate",
  WebSocketSendHandshakeRequest = "WebSocketSendHandshakeRequest",
  WebSocketReceiveHandshakeResponse = "WebSocketReceiveHandshakeResponse",
  WebSocketDestroy = "WebSocketDestroy",

  EmbedderCallback = "EmbedderCallback",

  SetLayerTreeId = "SetLayerTreeId",
  TracingStartedInPage = "TracingStartedInPage",
  TracingSessionIdForWorker = "TracingSessionIdForWorker",

  DecodeImage = "Decode Image",
  ResizeImage = "Resize Image",
  DrawLazyPixelRef = "Draw LazyPixelRef",
  DecodeLazyPixelRef = "Decode LazyPixelRef",

  LazyPixelRef = "LazyPixelRef",
  LayerTreeHostImplSnapshot = "cc::LayerTreeHostImpl",
  PictureSnapshot = "cc::Picture",
  DisplayItemListSnapshot = "cc::DisplayItemList",
  LatencyInfo = "LatencyInfo",
  LatencyInfoFlow = "LatencyInfo.Flow",
  InputLatencyMouseMove = "InputLatency::MouseMove",
  InputLatencyMouseWheel = "InputLatency::MouseWheel",
  ImplSideFling = "InputHandlerProxy::HandleGestureFling::started",
  GCCollectGarbage = "BlinkGC.AtomicPhase",

  CryptoDoEncrypt = "DoEncrypt",
  CryptoDoEncryptReply = "DoEncryptReply",
  CryptoDoDecrypt = "DoDecrypt",
  CryptoDoDecryptReply = "DoDecryptReply",
  CryptoDoDigest = "DoDigest",
  CryptoDoDigestReply = "DoDigestReply",
  CryptoDoSign = "DoSign",
  CryptoDoSignReply = "DoSignReply",
  CryptoDoVerify = "DoVerify",
  CryptoDoVerifyReply = "DoVerifyReply",

  // CpuProfile is a virtual event created on frontend to support
  // serialization of CPU Profiles within tracing timeline data.
  CpuProfile = "CpuProfile",
  Profile = "Profile",

  AsyncTask = "AsyncTask",
}
let categories;
function getCategories(): {
  [x: string]: TimelineCategory;
} {
  if (categories) {
    return categories;
  }
  categories = {
    loading: new TimelineCategory(
      "loading",
      "loading",
      true,
      "hsl(214, 67%, 74%)",
      "hsl(214, 67%, 66%)",
    ),
    experience: new TimelineCategory(
      "experience",
      "experience",
      false,
      "hsl(5, 80%, 74%)",
      "hsl(5, 80%, 66%)",
    ),
    scripting: new TimelineCategory(
      "scripting",
      "scripting",
      true,
      "hsl(43, 83%, 72%)",
      "hsl(43, 83%, 64%) ",
    ),
    rendering: new TimelineCategory(
      "rendering",
      "rendering",

      true,
      "hsl(256, 67%, 76%)",
      "hsl(256, 67%, 70%)",
    ),
    painting: new TimelineCategory(
      "painting",
      "painting",

      true,
      "hsl(109, 33%, 64%)",
      "hsl(109, 33%, 55%)",
    ),
    gpu: new TimelineCategory(
      "gpu",
      "gpu",

      false,
      "hsl(109, 33%, 64%)",
      "hsl(109, 33%, 55%)",
    ),
    async: new TimelineCategory(
      "async",
      "async",

      false,
      "hsl(0, 100%, 50%)",
      "hsl(0, 100%, 40%)",
    ),
    other: new TimelineCategory(
      "other",
      "other",

      false,
      "hsl(0, 0%, 87%)",
      "hsl(0, 0%, 79%)",
    ),
    idle: new TimelineCategory(
      "idle",
      "idle",

      false,
      "hsl(0, 0%, 98%)",
      "hsl(0, 0%, 98%)",
    ),
  };
  return categories;
}
function initEventStyles(): EventStylesMap {
  if (eventStylesMap) {
    return eventStylesMap;
  }

  const type = RecordType;
  const categories = getCategories();
  const rendering = categories["rendering"];
  const scripting = categories["scripting"];
  const loading = categories["loading"];
  const experience = categories["experience"];
  const painting = categories["painting"];
  const other = categories["other"];
  const idle = categories["idle"];

  const eventStyles: EventStylesMap = {};
  eventStyles[type.Task] = new TimelineRecordStyle(UIStrings.task, other);
  eventStyles[type.Program] = new TimelineRecordStyle(UIStrings.other, other);
  eventStyles[type.Animation] = new TimelineRecordStyle(
    UIStrings.animation,
    rendering,
  );
  eventStyles[type.EventDispatch] = new TimelineRecordStyle(
    UIStrings.event,
    scripting,
  );
  eventStyles[type.RequestMainThreadFrame] = new TimelineRecordStyle(
    UIStrings.requestMainThreadFrame,
    rendering,
    true,
  );
  eventStyles[type.BeginFrame] = new TimelineRecordStyle(
    UIStrings.frameStart,
    rendering,
    true,
  );
  eventStyles[type.BeginMainThreadFrame] = new TimelineRecordStyle(
    UIStrings.frameStartMainThread,
    rendering,
    true,
  );
  eventStyles[type.DrawFrame] = new TimelineRecordStyle(
    UIStrings.drawFrame,
    rendering,
    true,
  );
  eventStyles[type.HitTest] = new TimelineRecordStyle(
    UIStrings.hitTest,
    rendering,
  );
  eventStyles[type.ScheduleStyleRecalculation] = new TimelineRecordStyle(
    UIStrings.scheduleStyleRecalculation,
    rendering,
  );
  eventStyles[type.RecalculateStyles] = new TimelineRecordStyle(
    UIStrings.recalculateStyle,
    rendering,
  );
  eventStyles[type.UpdateLayoutTree] = new TimelineRecordStyle(
    UIStrings.recalculateStyle,
    rendering,
  );
  eventStyles[type.InvalidateLayout] = new TimelineRecordStyle(
    UIStrings.invalidateLayout,
    rendering,
    true,
  );
  eventStyles[type.Layout] = new TimelineRecordStyle(
    UIStrings.layout,
    rendering,
  );
  eventStyles[type.PaintSetup] = new TimelineRecordStyle(
    UIStrings.paintSetup,
    painting,
  );
  eventStyles[type.PaintImage] = new TimelineRecordStyle(
    UIStrings.paintImage,
    painting,
    true,
  );
  eventStyles[type.UpdateLayer] = new TimelineRecordStyle(
    UIStrings.updateLayer,
    painting,
    true,
  );
  eventStyles[type.UpdateLayerTree] = new TimelineRecordStyle(
    UIStrings.updateLayerTree,
    rendering,
  );
  eventStyles[type.Paint] = new TimelineRecordStyle(UIStrings.paint, painting);
  eventStyles[type.PrePaint] = new TimelineRecordStyle(
    UIStrings.prePaint,
    rendering,
  );
  eventStyles[type.RasterTask] = new TimelineRecordStyle(
    UIStrings.rasterizePaint,
    painting,
  );
  eventStyles[type.ScrollLayer] = new TimelineRecordStyle(
    UIStrings.scroll,
    rendering,
  );
  eventStyles[type.CompositeLayers] = new TimelineRecordStyle(
    UIStrings.compositeLayers,
    painting,
  );
  eventStyles[type.ComputeIntersections] = new TimelineRecordStyle(
    UIStrings.computeIntersections,
    rendering,
  );
  eventStyles[type.ParseHTML] = new TimelineRecordStyle(
    UIStrings.parseHtml,
    loading,
  );
  eventStyles[type.ParseAuthorStyleSheet] = new TimelineRecordStyle(
    UIStrings.parseStylesheet,
    loading,
  );
  eventStyles[type.TimerInstall] = new TimelineRecordStyle(
    UIStrings.installTimer,
    scripting,
  );
  eventStyles[type.TimerRemove] = new TimelineRecordStyle(
    UIStrings.removeTimer,
    scripting,
  );
  eventStyles[type.TimerFire] = new TimelineRecordStyle(
    UIStrings.timerFired,
    scripting,
  );
  eventStyles[type.XHRReadyStateChange] = new TimelineRecordStyle(
    UIStrings.xhrReadyStateChange,
    scripting,
  );
  eventStyles[type.XHRLoad] = new TimelineRecordStyle(
    UIStrings.xhrLoad,
    scripting,
  );
  eventStyles[type.CompileScript] = new TimelineRecordStyle(
    UIStrings.compileScript,
    scripting,
  );
  eventStyles[type.CacheScript] = new TimelineRecordStyle(
    UIStrings.cacheScript,
    scripting,
  );
  eventStyles[type.CompileCode] = new TimelineRecordStyle(
    UIStrings.compileCode,
    scripting,
  );
  eventStyles[type.OptimizeCode] = new TimelineRecordStyle(
    UIStrings.optimizeCode,
    scripting,
  );
  eventStyles[type.EvaluateScript] = new TimelineRecordStyle(
    UIStrings.evaluateScript,
    scripting,
  );
  eventStyles[type.CompileModule] = new TimelineRecordStyle(
    UIStrings.compileModule,
    scripting,
  );
  eventStyles[type.CacheModule] = new TimelineRecordStyle(
    UIStrings.cacheModule,
    scripting,
  );
  eventStyles[type.EvaluateModule] = new TimelineRecordStyle(
    UIStrings.evaluateModule,
    scripting,
  );
  eventStyles[type.StreamingCompileScript] = new TimelineRecordStyle(
    UIStrings.streamingCompileTask,
    other,
  );
  eventStyles[type.StreamingCompileScriptWaiting] = new TimelineRecordStyle(
    UIStrings.waitingForNetwork,
    idle,
  );
  eventStyles[type.StreamingCompileScriptParsing] = new TimelineRecordStyle(
    UIStrings.parseAndCompile,
    scripting,
  );
  eventStyles[type.WasmStreamFromResponseCallback] = new TimelineRecordStyle(
    UIStrings.streamingWasmResponse,
    scripting,
  );
  eventStyles[type.WasmCompiledModule] = new TimelineRecordStyle(
    UIStrings.compiledWasmModule,
    scripting,
  );
  eventStyles[type.WasmCachedModule] = new TimelineRecordStyle(
    UIStrings.cachedWasmModule,
    scripting,
  );
  eventStyles[type.WasmModuleCacheHit] = new TimelineRecordStyle(
    UIStrings.wasmModuleCacheHit,
    scripting,
  );
  eventStyles[type.WasmModuleCacheInvalid] = new TimelineRecordStyle(
    UIStrings.wasmModuleCacheInvalid,
    scripting,
  );
  eventStyles[type.FrameStartedLoading] = new TimelineRecordStyle(
    UIStrings.frameStartedLoading,
    loading,
    true,
  );
  eventStyles[type.MarkLoad] = new TimelineRecordStyle(
    UIStrings.onloadEvent,
    scripting,
    true,
  );
  eventStyles[type.MarkDOMContent] = new TimelineRecordStyle(
    UIStrings.domcontentloadedEvent,
    scripting,
    true,
  );
  eventStyles[type.MarkFirstPaint] = new TimelineRecordStyle(
    UIStrings.firstPaint,
    painting,
    true,
  );
  eventStyles[type.MarkFCP] = new TimelineRecordStyle(
    UIStrings.firstContentfulPaint,
    rendering,
    true,
  );
  eventStyles[type.MarkLCPCandidate] = new TimelineRecordStyle(
    UIStrings.largestContentfulPaint,
    rendering,
    true,
  );
  eventStyles[type.TimeStamp] = new TimelineRecordStyle(
    UIStrings.timestamp,
    scripting,
  );
  eventStyles[type.ConsoleTime] = new TimelineRecordStyle(
    UIStrings.consoleTime,
    scripting,
  );
  eventStyles[type.UserTiming] = new TimelineRecordStyle(
    UIStrings.userTiming,
    scripting,
  );
  eventStyles[type.ResourceWillSendRequest] = new TimelineRecordStyle(
    UIStrings.willSendRequest,
    loading,
  );
  eventStyles[type.ResourceSendRequest] = new TimelineRecordStyle(
    UIStrings.sendRequest,
    loading,
  );
  eventStyles[type.ResourceReceiveResponse] = new TimelineRecordStyle(
    UIStrings.receiveResponse,
    loading,
  );
  eventStyles[type.ResourceFinish] = new TimelineRecordStyle(
    UIStrings.finishLoading,
    loading,
  );
  eventStyles[type.ResourceReceivedData] = new TimelineRecordStyle(
    UIStrings.receiveData,
    loading,
  );
  eventStyles[type.RunMicrotasks] = new TimelineRecordStyle(
    UIStrings.runMicrotasks,
    scripting,
  );
  eventStyles[type.FunctionCall] = new TimelineRecordStyle(
    UIStrings.functionCall,
    scripting,
  );
  eventStyles[type.GCEvent] = new TimelineRecordStyle(
    UIStrings.gcEvent,
    scripting,
  );
  eventStyles[type.MajorGC] = new TimelineRecordStyle(
    UIStrings.majorGc,
    scripting,
  );
  eventStyles[type.MinorGC] = new TimelineRecordStyle(
    UIStrings.minorGc,
    scripting,
  );
  eventStyles[type.JSFrame] = new TimelineRecordStyle(
    UIStrings.jsFrame,
    scripting,
  );
  eventStyles[type.RequestAnimationFrame] = new TimelineRecordStyle(
    UIStrings.requestAnimationFrame,
    scripting,
  );
  eventStyles[type.CancelAnimationFrame] = new TimelineRecordStyle(
    UIStrings.cancelAnimationFrame,
    scripting,
  );
  eventStyles[type.FireAnimationFrame] = new TimelineRecordStyle(
    UIStrings.animationFrameFired,
    scripting,
  );
  eventStyles[type.RequestIdleCallback] = new TimelineRecordStyle(
    UIStrings.requestIdleCallback,
    scripting,
  );
  eventStyles[type.CancelIdleCallback] = new TimelineRecordStyle(
    UIStrings.cancelIdleCallback,
    scripting,
  );
  eventStyles[type.FireIdleCallback] = new TimelineRecordStyle(
    UIStrings.fireIdleCallback,
    scripting,
  );
  eventStyles[type.WebSocketCreate] = new TimelineRecordStyle(
    UIStrings.createWebsocket,
    scripting,
  );
  eventStyles[type.WebSocketSendHandshakeRequest] = new TimelineRecordStyle(
    UIStrings.sendWebsocketHandshake,
    scripting,
  );
  eventStyles[type.WebSocketReceiveHandshakeResponse] = new TimelineRecordStyle(
    UIStrings.receiveWebsocketHandshake,
    scripting,
  );
  eventStyles[type.WebSocketDestroy] = new TimelineRecordStyle(
    UIStrings.destroyWebsocket,
    scripting,
  );
  eventStyles[type.EmbedderCallback] = new TimelineRecordStyle(
    UIStrings.embedderCallback,
    scripting,
  );
  eventStyles[type.DecodeImage] = new TimelineRecordStyle(
    UIStrings.imageDecode,
    painting,
  );
  eventStyles[type.ResizeImage] = new TimelineRecordStyle(
    UIStrings.imageResize,
    painting,
  );
  eventStyles[type.GPUTask] = new TimelineRecordStyle(
    UIStrings.gpu,
    categories["gpu"],
  );
  eventStyles[type.LatencyInfo] = new TimelineRecordStyle(
    UIStrings.inputLatency,
    scripting,
  );

  eventStyles[type.GCCollectGarbage] = new TimelineRecordStyle(
    UIStrings.domGc,
    scripting,
  );

  eventStyles[type.CryptoDoEncrypt] = new TimelineRecordStyle(
    UIStrings.encrypt,
    scripting,
  );
  eventStyles[type.CryptoDoEncryptReply] = new TimelineRecordStyle(
    UIStrings.encryptReply,
    scripting,
  );
  eventStyles[type.CryptoDoDecrypt] = new TimelineRecordStyle(
    UIStrings.decrypt,
    scripting,
  );
  eventStyles[type.CryptoDoDecryptReply] = new TimelineRecordStyle(
    UIStrings.decryptReply,
    scripting,
  );
  eventStyles[type.CryptoDoDigest] = new TimelineRecordStyle(
    UIStrings.digest,
    scripting,
  );
  eventStyles[type.CryptoDoDigestReply] = new TimelineRecordStyle(
    UIStrings.digestReply,
    scripting,
  );
  eventStyles[type.CryptoDoSign] = new TimelineRecordStyle(
    UIStrings.sign,
    scripting,
  );
  eventStyles[type.CryptoDoSignReply] = new TimelineRecordStyle(
    UIStrings.signReply,
    scripting,
  );
  eventStyles[type.CryptoDoVerify] = new TimelineRecordStyle(
    UIStrings.verify,
    scripting,
  );
  eventStyles[type.CryptoDoVerifyReply] = new TimelineRecordStyle(
    UIStrings.verifyReply,
    scripting,
  );

  eventStyles[type.AsyncTask] = new TimelineRecordStyle(
    UIStrings.asyncTask,
    categories["async"],
  );

  eventStyles[type.LayoutShift] = new TimelineRecordStyle(
    UIStrings.layoutShift,
    experience,
  );

  eventStyles[type.EventTiming] = new TimelineRecordStyle(
    UIStrings.eventTiming,
    experience,
  );

  eventStylesMap = eventStyles;
  return eventStyles;
}
export enum InputEvents {
  Char = "Char",
  Click = "GestureClick",
  ContextMenu = "ContextMenu",
  FlingCancel = "GestureFlingCancel",
  FlingStart = "GestureFlingStart",
  ImplSideFling = "InputHandlerProxy::HandleGestureFling::started",
  KeyDown = "KeyDown",
  KeyDownRaw = "RawKeyDown",
  KeyUp = "KeyUp",
  LatencyScrollUpdate = "ScrollUpdate",
  MouseDown = "MouseDown",
  MouseMove = "MouseMove",
  MouseUp = "MouseUp",
  MouseWheel = "MouseWheel",
  PinchBegin = "GesturePinchBegin",
  PinchEnd = "GesturePinchEnd",
  PinchUpdate = "GesturePinchUpdate",
  ScrollBegin = "GestureScrollBegin",
  ScrollEnd = "GestureScrollEnd",
  ScrollUpdate = "GestureScrollUpdate",
  ScrollUpdateRenderer = "ScrollUpdate",
  ShowPress = "GestureShowPress",
  Tap = "GestureTap",
  TapCancel = "GestureTapCancel",
  TapDown = "GestureTapDown",
  TouchCancel = "TouchCancel",
  TouchEnd = "TouchEnd",
  TouchMove = "TouchMove",
  TouchStart = "TouchStart",
}
let inputEventToDisplayName: Map<InputEvents, string>;

function getInputEventDisplayName(inputEventType: any): string | null {
  if (!inputEventToDisplayName) {
    const inputEvent = InputEvents;

    inputEventToDisplayName = new Map([
      [inputEvent.Char, UIStrings.keyCharacter],
      [inputEvent.KeyDown, UIStrings.keyDown],
      [inputEvent.KeyDownRaw, UIStrings.keyDown],
      [inputEvent.KeyUp, UIStrings.keyUp],
      [inputEvent.Click, UIStrings.click],
      [inputEvent.ContextMenu, UIStrings.contextMenu],
      [inputEvent.MouseDown, UIStrings.mouseDown],
      [inputEvent.MouseMove, UIStrings.mouseMove],
      [inputEvent.MouseUp, UIStrings.mouseUp],
      [inputEvent.MouseWheel, UIStrings.mouseWheel],
      [inputEvent.ScrollBegin, UIStrings.scrollBegin],
      [inputEvent.ScrollEnd, UIStrings.scrollEnd],
      [inputEvent.ScrollUpdate, UIStrings.scrollUpdate],
      [inputEvent.FlingStart, UIStrings.flingStart],
      [inputEvent.FlingCancel, UIStrings.flingHalt],
      [inputEvent.Tap, UIStrings.tap],
      [inputEvent.TapCancel, UIStrings.tapHalt],
      [inputEvent.ShowPress, UIStrings.tapBegin],
      [inputEvent.TapDown, UIStrings.tapDown],
      [inputEvent.TouchCancel, UIStrings.touchCancel],
      [inputEvent.TouchEnd, UIStrings.touchEnd],
      [inputEvent.TouchMove, UIStrings.touchMove],
      [inputEvent.TouchStart, UIStrings.touchStart],
      [inputEvent.PinchBegin, UIStrings.pinchBegin],
      [inputEvent.PinchEnd, UIStrings.pinchEnd],
      [inputEvent.PinchUpdate, UIStrings.pinchUpdate],
    ]);
  }
  return inputEventToDisplayName.get(inputEventType) || null;
}

function visibleTypes(): string[] {
  const eventStyles = initEventStyles();
  const result = [];
  for (const name in eventStyles) {
    if (!eventStyles[name].hidden) {
      result.push(name);
    }
  }
  return result;
}
function visibleEventsFilter() {
  return new TimelineVisibleEventsFilter(visibleTypes());
}
function eventStyle(event: Event): TimelineRecordStyle {
  const eventStyles = initEventStyles();
  if (
    event.hasCategory(TimelineModelImpl.Category.Console) ||
    event.hasCategory(TimelineModelImpl.Category.UserTiming)
  ) {
    return new TimelineRecordStyle(event.name, getCategories()["scripting"]);
  }

  if (event.hasCategory(TimelineModelImpl.Category.LatencyInfo)) {
    /** @const */
    const prefix = "InputLatency::";
    const inputEventType = event.name.startsWith(prefix)
      ? event.name.substr(prefix.length)
      : event.name;
    const displayName = getInputEventDisplayName(inputEventType as InputEvents);
    return new TimelineRecordStyle(
      displayName || inputEventType,
      getCategories()["scripting"],
    );
  }
  let result: TimelineRecordStyle = eventStyles[event.name];
  if (!result) {
    result = new TimelineRecordStyle(
      event.name,
      getCategories()["other"],
      true,
    );
    eventStyles[event.name] = result;
  }
  return result;
}
export const statsForTimeRange = (
  events: any,
  startTime: number,
  endTime: number,
): {
  [x: string]: number;
} => {
  if (!events.length) {
    return { idle: endTime - startTime };
  }

  buildRangeStatsCacheIfNeeded(events);
  const aggregatedStats = subtractStats(
    aggregatedStatsAtTime(endTime),
    aggregatedStatsAtTime(startTime),
  );
  const aggregatedTotal = Object.values(aggregatedStats).reduce(
    (a, b) => a + b,
    0,
  );
  aggregatedStats["idle"] = Math.max(0, endTime - startTime - aggregatedTotal);
  return aggregatedStats;

  function aggregatedStatsAtTime(
    time: number,
  ): {
    [x: string]: number;
  } {
    const stats: {
      [x: string]: number;
    } = {};
    const cache = events[categoryBreakdownCacheSymbol];
    for (const category in cache) {
      const categoryCache = cache[category];
      const index = ArrayUtilities.upperBound(
        categoryCache.time,
        time,
        ArrayUtilities.DEFAULT_COMPARATOR,
      );
      let value;
      if (index === 0) {
        value = 0;
      } else if (index === categoryCache.time.length) {
        value = categoryCache.value[categoryCache.value.length - 1];
      } else {
        const t0 = categoryCache.time[index - 1];
        const t1 = categoryCache.time[index];
        const v0 = categoryCache.value[index - 1];
        const v1 = categoryCache.value[index];
        value = v0 + ((v1 - v0) * (time - t0)) / (t1 - t0);
      }
      stats[category] = value;
    }
    return stats;
  }

  function subtractStats(
    a: {
      [x: string]: number;
    },
    b: {
      [x: string]: number;
    },
  ): {
    [x: string]: number;
  } {
    const result = Object.assign({}, a);
    for (const key in b) {
      result[key] -= b[key];
    }
    return result;
  }

  function buildRangeStatsCacheIfNeeded(events: any[]): void {
    if (events[categoryBreakdownCacheSymbol]) {
      return;
    }

    // aggeregatedStats is a map by categories. For each category there's an array
    // containing sorted time points which records accumulated value of the category.
    const aggregatedStats: {
      [x: string]: {
        time: number[];
        value: number[];
      };
    } = {};
    const categoryStack: string[] = [];
    let lastTime = 0;
    TimelineModelImpl.forEachEvent(
      events,
      onStartEvent,
      onEndEvent,
      undefined,
      undefined,
      undefined,
      filterForStats(),
    );

    function filterForStats(): (arg0: any) => boolean {
      const visibleEvents = visibleEventsFilter();
      return (event: any): boolean =>
        visibleEvents.accept(event) || TracingModel.isTopLevelEvent(event);
    }

    function updateCategory(category: string, time: number): void {
      let statsArrays: {
        time: number[];
        value: number[];
      } = aggregatedStats[category];
      if (!statsArrays) {
        statsArrays = { time: [], value: [] };
        aggregatedStats[category] = statsArrays;
      }
      if (
        (statsArrays.time.length &&
          statsArrays.time[statsArrays.time.length - 1] === time) ||
        lastTime > time
      ) {
        return;
      }
      const lastValue =
        statsArrays.value.length > 0
          ? statsArrays.value[statsArrays.value.length - 1]
          : 0;
      statsArrays.value.push(lastValue + time - lastTime);
      statsArrays.time.push(time);
    }

    function categoryChange(
      from: string | null,
      to: string | null,
      time: number,
    ): void {
      if (from) {
        updateCategory(from, time);
      }
      lastTime = time;
      if (to) {
        updateCategory(to, time);
      }
    }

    function onStartEvent(e: any): void {
      const category = eventStyle(e).category.name;
      const parentCategory = categoryStack.length
        ? categoryStack[categoryStack.length - 1]
        : null;
      if (category !== parentCategory) {
        categoryChange(parentCategory || null, category, e.startTime);
      }
      categoryStack.push(category);
    }

    function onEndEvent(e: any): void {
      const category = categoryStack.pop();
      const parentCategory = categoryStack.length
        ? categoryStack[categoryStack.length - 1]
        : null;
      if (category !== parentCategory) {
        categoryChange(
          category || null,
          parentCategory || null,
          e.endTime || 0,
        );
      }
    }

    const obj = events as Object;
    obj[categoryBreakdownCacheSymbol] = aggregatedStats;
  }
};

// const eventStyle = (event: SDK.TracingModel.Event) => {
//   const eventStyles = TimelineUIUtils.initEventStyles();
//   if (
//     event.hasCategory(TimelineModelImpl.Category.Console) ||
//     event.hasCategory(TimelineModelImpl.Category.UserTiming)
//   ) {
//     return new TimelineRecordStyle(
//       event.name,
//       TimelineUIUtils.categories()["scripting"],
//     );
//   }

//   if (event.hasCategory(TimelineModelImpl.Category.LatencyInfo)) {
//     /** @const */
//     const prefix = "InputLatency::";
//     const inputEventType = event.name.startsWith(prefix)
//       ? event.name.substr(prefix.length)
//       : event.name;
//     const displayName = TimelineUIUtils.inputEventDisplayName(
//       inputEventType as TimelineModel.TimelineIRModel.InputEvents,
//     );
//     return new TimelineRecordStyle(
//       displayName || inputEventType,
//       TimelineUIUtils.categories()["scripting"],
//     );
//   }
//   let result: TimelineRecordStyle = eventStyles[event.name];
//   if (!result) {
//     result = new TimelineRecordStyle(
//       event.name,
//       TimelineUIUtils.categories()["other"],
//       true,
//     );
//     eventStyles[event.name] = result;
//   }
//   return result;
// };
