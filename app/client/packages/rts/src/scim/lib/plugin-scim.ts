"use strict";

import ScimGateway from "scimgateway/lib/scimgateway";
import http from "http";
import https from "https";
import HttpsProxyAgent from "https-proxy-agent";
import querystring from "querystring";
import { getUsers } from "./handlers/users/getUsers";
import { createUser } from "./handlers/users/createUser";
import { deleteUser } from "./handlers/users/deleteUser";
import { modifyUser } from "./handlers/users/modifyUser";
import { createGroup } from "./handlers/groups/createGroup";
import { deleteGroup } from "./handlers/groups/deleteGroup";
import { modifyGroup } from "./handlers/groups/modifyGroup";
import { getGroups } from "./handlers/groups/getGroups";
import { NO_RESPONSE_ERROR, createMessage } from "@scim/constants/messages";

export const scimGateway: ScimGateway = new ScimGateway();
scimGateway.authPassThroughAllowed = true;
export const pluginName = "plugin-scim";
export const configFile = "../config/plugin-scim.json";
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const config: any = require(configFile).endpoint;
const _serviceClient: any = {};

export const USER_PROVISION_ENDPOINT = "/users";
export const GROUP_PROVISION_ENDPOINT = "/groups";

scimGateway.getUsers = getUsers;
scimGateway.createUser = createUser;
scimGateway.deleteUser = deleteUser;
scimGateway.modifyUser = modifyUser;
scimGateway.getGroups = getGroups;
scimGateway.createGroup = createGroup;
scimGateway.deleteGroup = deleteGroup;
scimGateway.modifyGroup = modifyGroup;

export const validateResponse = (response: any) => {
  if (!response.body) {
    throw new Error(createMessage(NO_RESPONSE_ERROR));
  }

  const responseMeta = response.body.responseMeta;
  const errorDisplay = response.body.errorDisplay;

  if (!responseMeta.success) {
    const err = new Error(`${response.statusMessage} - ${errorDisplay}`);
    if (responseMeta.status === 404) {
      return true; // when a resource is deleted it fetches for the resource again with the id which returns 404 (expected), hence returning true here by default
    }
    if (
      responseMeta.status === 409 &&
      responseMeta.error.title === "Duplicate key"
    ) {
      err.name = "uniqueness"; // error name is set to uniqueness because SCIM gateway has a special handling for duplication by this error name specifically
    } else {
      err.name = responseMeta.error.errorType;
    }
    throw err;
  }

  if (responseMeta.success) {
    return true;
  }

  if (response.statusCode < 200 || response.statusCode > 299) {
    throw new Error(
      `${response.statusMessage} - ${JSON.stringify(response.body)}`,
    );
  }
};

const getClientIdentifier = (ctx: any): string | undefined => {
  if (!ctx?.request?.header?.authorization) return undefined;
  const [user, secret] = getCtxAuth(ctx);
  return `${encodeURIComponent(user)}_${encodeURIComponent(secret)}`;
};

const getCtxAuth = (ctx: any): [string | undefined, string] => {
  if (!ctx?.request?.header?.authorization) return [undefined, ""];
  // eslint-disable-next-line
  const [authType, authToken] = (ctx.request.header.authorization || "").split(
    " ",
  ); // [0] = 'Bearer'
  return [undefined, authToken]; // bearer auth
};

const getServiceClient = async (
  baseEntity: string,
  method: string,
  path: string,
  opt: any,
  ctx: any,
): Promise<any> => {
  const action = "getServiceClient";

  let urlObj: URL;
  if (!path) path = "";
  try {
    urlObj = new URL(path);
  } catch (err) {
    //
    // path (no url) - default approach and client will be cached based on config
    //
    const clientIdentifier = getClientIdentifier(ctx);
    if (
      _serviceClient[baseEntity] &&
      _serviceClient[baseEntity][clientIdentifier]
    ) {
      // serviceClient already exists
      scimGateway.logger.debug(
        `${pluginName}[${baseEntity}] ${action}: Using existing client`,
      );
    } else {
      scimGateway.logger.debug(
        `${pluginName}[${baseEntity}] ${action}: Client has to be created`,
      );
      let client = null;
      if (config.entity && config.entity[baseEntity])
        client = config.entity[baseEntity];
      if (!client) {
        throw new Error(
          `Base URL has baseEntity=${baseEntity}, and the configuration file ${pluginName}.json is missing the required baseEntity configuration for ${baseEntity}`,
        );
      }

      urlObj = new URL(config.entity[baseEntity].baseUrls[0]);
      const [, apiKey] = getCtxAuth(ctx);
      const param: any = {
        baseUrl: config.entity[baseEntity].baseUrls[0],
        options: {
          json: true, // json-object response instead of string
          headers: {
            "Content-Type": "application/json",
            // Auth PassThrough or configuration, using ctx "AS-IS" header for PassThrough. For more advanced logic use getCtxAuth(ctx) - see examples in other plugins
            // Authorization: ctx?.request?.header?.authorization ? ctx.request.header.authorization : 'Basic ' + Buffer.from(`${config.entity[baseEntity].username}:${scimGateway.getPassword(`endpoint.entity.${baseEntity}.password`, configFile)}`).toString('base64'),
            "x-appsmith-key": apiKey,
            "x-requested-by": "Appsmith",
          },
          host: urlObj.hostname,
          port: urlObj.port, // null if https and 443 defined in url
          protocol: urlObj.protocol, // http: or https:
          rejectUnauthorized: false, // accepts self-signed certificates
          // 'method' and 'path' added at the end
        },
      };

      // proxy
      if (
        config.entity[baseEntity].proxy &&
        config.entity[baseEntity].proxy.host
      ) {
        const agent = new (HttpsProxyAgent as any)(
          config.entity[baseEntity].proxy.host,
        );
        param.options.agent = agent; // proxy
        if (
          config.entity[baseEntity].proxy.username &&
          config.entity[baseEntity].proxy.password
        ) {
          param.options.headers["Proxy-Authorization"] =
            "Basic " +
            Buffer.from(
              `${
                config.entity[baseEntity].proxy.username
              }:${scimGateway.getPassword(
                `endpoint.entity.${baseEntity}.proxy.password`,
                configFile,
              )}`,
            ).toString("base64"); // using proxy with auth
        }
      }

      if (!_serviceClient[baseEntity]) _serviceClient[baseEntity] = {};
      if (!_serviceClient[baseEntity][clientIdentifier])
        _serviceClient[baseEntity][clientIdentifier] = {};
      _serviceClient[baseEntity][clientIdentifier] = param; // serviceClient created
    }

    const cli = scimGateway.copyObj(
      _serviceClient[baseEntity][clientIdentifier],
    ); // client ready

    // failover support
    path = _serviceClient[baseEntity][clientIdentifier].baseUrl + path;
    urlObj = new URL(path);
    cli.options.host = urlObj.hostname;
    cli.options.port = urlObj.port;
    cli.options.protocol = urlObj.protocol;

    // adding none static
    cli.options.method = method;
    cli.options.path = `${urlObj.pathname}${urlObj.search}`;
    if (opt) cli.options = scimGateway.extendObj(cli.options, opt); // merge with argument options

    return cli; // final client
  }
  //
  // url path - none config based and used as is (no cache)
  //
  scimGateway.logger.debug(
    `${pluginName}[${baseEntity}] ${action}: Using none config based client`,
  );
  let options: any = {
    json: true,
    headers: {
      "Content-Type": "application/json",
    },
    host: urlObj.hostname,
    port: urlObj.port,
    protocol: urlObj.protocol,
    method: method,
    path: urlObj.pathname,
  };

  // proxy
  if (config.entity[baseEntity].proxy && config.entity[baseEntity].proxy.host) {
    const agent = new (HttpsProxyAgent as any)(
      config.entity[baseEntity].proxy.host,
    );
    options.agent = agent; // proxy
    if (
      config.entity[baseEntity].proxy.username &&
      config.entity[baseEntity].proxy.password
    ) {
      options.headers["Proxy-Authorization"] =
        "Basic " +
        Buffer.from(
          `${
            config.entity[baseEntity].proxy.username
          }:${scimGateway.getPassword(
            `endpoint.entity.${baseEntity}.proxy.password`,
            configFile,
          )}`,
        ).toString("base64"); // using proxy with auth
    }
  }

  // merge any argument options - support basic auth using {auth: {username: "username", password: "password"} }
  if (opt) {
    const o = scimGateway.copyObj(opt);
    if (o.auth) {
      options.headers.Authorization =
        "Basic " +
        Buffer.from(`${o.auth.username}:${o.auth.password}`).toString("base64");
      delete o.auth;
    }
    options = scimGateway.extendObj(options, o);
  }

  const cli: any = {};
  cli.options = options;
  return cli; // final client
};

const updateServiceClient = (
  baseEntity: string,
  clientIdentifier: string,
  obj: any,
): void => {
  if (
    _serviceClient[baseEntity] &&
    _serviceClient[baseEntity][clientIdentifier]
  ) {
    _serviceClient[baseEntity][clientIdentifier] = scimGateway.extendObj(
      _serviceClient[baseEntity][clientIdentifier],
      obj,
    ); // merge with argument options
  }
};

export const doRequest = async (
  baseEntity: string,
  method: string,
  path: string,
  body: any,
  ctx: any,
  opt?: any,
  retryCount?: number,
): Promise<any> => {
  try {
    const cli = await getServiceClient(baseEntity, method, path, opt, ctx);
    const options = cli.options;
    const result = await new Promise<any>((resolve, reject) => {
      let dataString = "";
      if (body) {
        if (
          options.headers["Content-Type"].toLowerCase() ===
          "application/x-www-form-urlencoded"
        ) {
          if (typeof body === "string") dataString = body;
          else dataString = querystring.stringify(body); // JSON to query string syntax + URL encoded
        } else dataString = JSON.stringify(body);
        options.headers["Content-Length"] = Buffer.byteLength(
          dataString,
          "utf8",
        );
      }

      const reqType =
        options.protocol.toLowerCase() === "https:"
          ? https.request
          : http.request;
      const req = reqType(options, (res) => {
        const { statusCode, statusMessage } = res;

        let responseString = "";
        res.setEncoding("utf-8");

        res.on("data", (chunk) => {
          responseString += chunk;
        });

        res.on("end", () => {
          const response = {
            statusCode: statusCode,
            statusMessage: statusMessage,
            body: null,
          };
          try {
            if (responseString) response.body = JSON.parse(responseString);
          } catch (err) {
            response.body = responseString;
          }
          if (statusCode == 401 || statusCode >= 500)
            reject(new Error(JSON.stringify(response)));
          resolve(response);
        });
      });

      req.on("socket", (socket) => {
        socket.setTimeout(60000); // connect and wait timeout => socket hang up
        socket.on("timeout", function () {
          req.abort();
        });
      });

      req.on("error", (error) => {
        req.end();
        reject(error);
      });

      if (dataString) req.write(dataString);
      req.end();
    });

    scimGateway.logger.debug(
      `${pluginName}[${baseEntity}] doRequest ${method} ${options.protocol}//${
        options.host
      }${options.port ? `:${options.port}` : ""}${path} Body = ${JSON.stringify(
        body,
      )} Response = ${JSON.stringify(result)}`,
    );
    return result;
  } catch (err) {
    scimGateway.logger.error(
      `${pluginName}[${baseEntity}] doRequest ${method} ${path} Body = ${JSON.stringify(
        body,
      )} Error Response = ${err.message}`,
    );
    let statusCode;
    try {
      statusCode = JSON.parse(err.message).statusCode;
    } catch (e) {}
    const clientIdentifier = getClientIdentifier(ctx);
    if (!retryCount) retryCount = 0;
    let urlObj;
    try {
      urlObj = new URL(path);
    } catch (err) {}
    if (!urlObj && (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND")) {
      if (retryCount < config.entity[baseEntity].baseUrls.length) {
        retryCount++;
        updateServiceClient(baseEntity, clientIdentifier, {
          baseUrl: config.entity[baseEntity].baseUrls[retryCount - 1],
        });
        scimGateway.logger.debug(
          `${pluginName}[${baseEntity}] ${
            config.entity[baseEntity].baseUrls.length > 1 ? "failover " : ""
          }retry[${retryCount}] using baseUrl = ${
            _serviceClient[baseEntity].baseUrl
          }`,
        );
        const ret = await doRequest(
          baseEntity,
          method,
          path,
          body,
          ctx,
          opt,
          retryCount,
        );
        return ret;
      } else {
        const newerr = new Error(err.message);
        newerr.message = newerr.message.replace(
          "ECONNREFUSED",
          "UnableConnectingService",
        );
        newerr.message = newerr.message.replace(
          "ENOTFOUND",
          "UnableConnectingHost",
        );
        throw newerr;
      }
    } else {
      if (statusCode === 401 && _serviceClient[baseEntity])
        delete _serviceClient[baseEntity][clientIdentifier];
      throw err;
    }
  }
};

process.on("SIGTERM", () => {
  // kill
});
process.on("SIGINT", () => {
  // Ctrl+C
});
