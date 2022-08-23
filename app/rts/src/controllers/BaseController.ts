import { Response } from "express";
import { ValidationError } from "express-validator";

type ErrorData = {
  error: string | string[];
  validation_error?: ValidationError[];
};

type ErrorBag = {
  success: boolean;
  message: string;
  data?: ErrorData;
};

type ResponseData = {
  success: boolean;
  message?: string;
  data: any;
};

export default class BaseController {
  serverErrorMessaage = "Something went wrong";
  sendResponse(
    response: Response,
    result: any,
    message?: string,
    code: number = 200
  ): Response<ResponseData> {
    return response.status(code).json({
      success: true,
      message,
      data: result,
    });
  }

  sendError(
    response: Response,
    error: string,
    errorMessage,
    code: number = 400
  ): Response<ErrorBag> {
    let errorBag: ErrorBag = { success: false, message: error };

    if (errorMessage.constructor.name === "Result") {
      const validationError = errorMessage.array();
      errorBag.data = {
        error: [validationError[0].msg],
        validation_error: validationError,
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
