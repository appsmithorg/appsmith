import type { Socket } from "socket.io";
import log from "loglevel";
import axios from "axios";

const API_BASE_URL = process.env.APPSMITH_API_BASE_URL;

export async function tryAuth(socket: Socket) {
  /* ********************************************************* */
  // TODO: This change is not being used at the moment. Instead of using the environment variable API_BASE_URL
  // we should be able to derive the API_BASE_URL from the host header. This will make configuration simpler
  // for the user. The problem with this implementation is that Axios doesn't work for https endpoints currently.
  // This needs to be debugged.
  /* ********************************************************* */

  // const host = socket.handshake.headers.host;
  const connectionCookie = socket?.handshake?.headers?.cookie;

  if (
    connectionCookie === undefined ||
    connectionCookie === null ||
    connectionCookie === ""
  ) {
    return false;
  }

  const matchedCookie = connectionCookie.match(/\bSESSION=\S+/);

  if (!matchedCookie) {
    return false;
  }

  const sessionCookie = matchedCookie[0];
  let response;

  try {
    response = await axios.request({
      method: "GET",
      url: API_BASE_URL + "/users/me",
      headers: {
        Cookie: sessionCookie,
      },
    });
  } catch (error) {
    if (error.response?.status === 401) {
      // eslint-disable-next-line no-console
      console.info(
        "401 received when authenticating user with cookie: " + sessionCookie,
      );
    } else if (error.response) {
      log.error(
        "Error response received while authentication: ",
        JSON.stringify(error.response.data), // this is so the message shows up in one line.
      );
    } else {
      log.error("Error authenticating", error.cause?.toString());
    }

    return false;
  }

  const email = response?.data?.data?.email;
  const name = response?.data?.data?.name ?? email;

  // If the session check API succeeds & the email/name is anonymousUser, then the user is not authenticated
  // and we should not allow them to join any rooms
  if (email == null || email === "anonymousUser" || name === "anonymousUser") {
    return false;
  }

  socket.data.email = email;
  socket.data.name = name;

  return true;
}
