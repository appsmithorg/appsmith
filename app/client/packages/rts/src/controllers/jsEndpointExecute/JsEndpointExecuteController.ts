import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";

export default class JsEndpointExecuteController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Receives a function to execute, name of function, and params
   * @param req - {name, code, params}
   * @param res - {output}
   * @returns response of request
   */
  async perfomJSEndpointExecute(req: Request, res: Response) {
    // console.log('Request mapping for js endpoint');
    try {
      const body = req.body;
      const functionName = body.name;
      const functionBody = body.code;
      // const functionBody = "function toCelsius(fahrenheit) {return (5/9) * (fahrenheit-32);} \n toCelsius(102.7);";
      const functionParams = body.params;
      // console.log('Executing function ' + functionName + ' with params ' + functionParams);

      // const functionDef =
      //   functionBody + functionName + "(" + functionParams + ");";
      // console.log('Execution Code is ' + functionDef);
      const functionDef = '(' + functionBody + ')(' + functionParams + ')';

      const result = {};
      const output = eval(functionDef);
      // console.log(output);

      result["result"] = output;
      return super.sendEntityResponse(res, result, true);
    } catch (err) {
      // console.log(err);
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}