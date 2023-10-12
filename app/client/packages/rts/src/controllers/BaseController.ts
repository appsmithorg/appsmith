import type { Response } from "express";
import type { ValidationError } from "express-validator";
import { StatusCodes } from "http-status-codes";
import type { IdentifierInfo } from "@shared/ast";

interface ErrorData {
  error: string | string[];
  validationErrors?: ValidationError[];
}

interface ErrorBag {
  success: boolean;
  message: string;
  data?: ErrorData;
}

interface ResponseData {
  success: boolean;
  message?: string;
  data: IdentifierInfo;
}

export default class BaseController {
  serverErrorMessaage = "Something went wrong";
  sendResponse(
    response: Response,
    result?: unknown,
    message?: string,
    code: number = StatusCodes.OK,
  ): Response<ResponseData> {
    return response.status(code).json({
      success: true,
      message,
      data: result,
    });
  }

  sendEntityResponse(
    response: Response,
    result?: unknown,
    success?: boolean,
    code: number = StatusCodes.OK,
  ): Response<ResponseData> {
    return response.status(code).json({
      success,
      data: result,
    });
  }

  sendError(
    response: Response,
    error: string,
    errorMessage,
    code: number = StatusCodes.BAD_REQUEST,
  ): Response<ErrorBag> {
    const errorBag: ErrorBag = { success: false, message: error };

    if (errorMessage.constructor.name === "Result") {
      const validationError = errorMessage.array();
      errorBag.data = {
        error: [validationError[0].msg],
        validationErrors: validationError,
      };
      //   errorBag.message = validationError[0].msg;
    } else {
      if (errorMessage.length > 1) {
        errorBag.data = { error: errorMessage };
      } else {
        errorBag.data = { error };
      }
    }

    return response.status(code).json(errorBag);
  }
}
