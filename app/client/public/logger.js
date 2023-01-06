const PULSE_API_ENDPOINT = "/api/v1/usage-pulse";
const PULSE_INTERVAL = 60; /* 1 hour in seconds */

/* TODO: This offset is too early and might lead to incorrent tracking needs to be revised */
const PULSE_INTERVAL_OFFSET = 0; /* offset seconds to subtract from interval */
const TRACKABLE_URL = "/app/"; /* when user is on editor and viewer. */
const USER_ACTIVITY_LISTENER_EVENT = "pointerdown";

/*
 * Function to return the current unix timestamp in seconds
 */
function getCurrentUTCTimestamp() {
  return (Date.now() / 1000);
}

/**
 * Sends HTTP pulse to the server, when beaconAPI is not available.
 * Fire and forget.
 */
function sendHTTPPulse() {
  fetch(PULSE_API_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
  })
    .catch(() => {
      // Ignore errors; fire and forget
    });
}

/**
 * Sends a usage-pulse to the server using the Beacon API.
 * If the Beacon API is not available, falls back to a standard fetch.
 * Note: Only sends pulse 
 */
function sendPulse() {
  navigator.sendBeacon(PULSE_API_ENDPOINT, "") || sendHTTPPulse();
}

function addActivityListener() {
  window.document.body.addEventListener(USER_ACTIVITY_LISTENER_EVENT, punchIn);
}
function removeActivityListener() {
  window.document.body.removeEventListener(USER_ACTIVITY_LISTENER_EVENT, punchIn);
}

let lastPulseTimestamp = 0;
let nextPulseTriggerRegisterationTimestamp = 0;

function scheduleNextPunchIn() {
  lastPulseTimestamp = getCurrentUTCTimestamp();
  nextPulseTriggerRegisterationTimestamp = lastPulseTimestamp + PULSE_INTERVAL;
  const startListentingIn = nextPulseTriggerRegisterationTimestamp - PULSE_INTERVAL_OFFSET;

  removeActivityListener();

  setTimeout(addActivityListener, startListentingIn * 1000);

  console.log("Fired at $$$$$ ", new Date(lastPulseTimestamp * 1000));
  console.log("user activity listener is suspended until $$$$$ ", new Date(nextPulseTriggerRegisterationTimestamp * 1000))
}

function punchIn() {
  if (window.location.href.includes(TRACKABLE_URL)) {
    sendPulse();
    scheduleNextPunchIn();
  } else {

  }
}

window.addEventListener("DOMContentLoaded", punchIn);

/*
 *  - When user loads the application, we send a pulse and set a timeout to fire in
 *    {PULSE_INTERVAL - PULSE_INTERVAL_OFFSET} seconds to register events to look for user
 *    activity.
 *  - We're using rolling window. i.e 
 *      1. Initial session start from the time user loads the application for first time.
 *      2. Subsequent session starts only on user activity after {PULSE_INTERVAL - PULSE_INTERVAL_OFFSET}
 *         seconds elapsed from the previous session start.
 *  - Example: 
 *    Let's say user starts session (application loads for first time) at 02:00:00 hrs, we fire a pulse and
 *    schedule a call to register events to look for user activity at 02:59:58 hrs.
 *    Now if the next user Activity is at 03:05:00 hrs , we fire the next pulse and schedule a call to register 
 *    events to look for next user activity at 04:04:58 hrs.
 *    
 */
