import { messages } from "./messages";

type Payload = unknown;

class Responser {
  private static getType(code: string) {
    return messages[code]?.code || code;
  }

  private static getMessage(code: string) {
    return messages[code]?.message || "Unknown status";
  }

  static success(data: Payload = {}) {
    return {
      statusCode: 200,
      data: {
        success: true,
        statusCode: "R200",
        type: Responser.getType("R200"),
        message: Responser.getMessage("R200"),
        data,
      },
    };
  }

  static custom(code: string, data: Payload = {}) {
    return {
      statusCode: 200,
      data: {
        success: true,
        statusCode: code,
        type: Responser.getType(code),
        message: Responser.getMessage(code),
        data,
      },
    };
  }

  static error(code?: string, err: Payload = {}) {
    const fallback = code || "R404";
    return {
      statusCode: 404,
      data: {
        success: false,
        type: Responser.getType(fallback),
        message: Responser.getMessage(fallback),
        data: err,
      },
    };
  }

  static badRequest() {
    return {
      statusCode: 400,
      data: {
        success: true,
        statusCode: "R400",
        message: Responser.getMessage("R400"),
      },
    };
  }

  static validationfail(errors: any) {
    return {
      statusCode: 422,
      data: {
        success: false,
        statusCode: 422,
        message: Object.values(errors.all())[0][0],
        data: errors,
      },
    };
  }
}

export default Responser;
export const success = Responser.success.bind(Responser);
export const custom = Responser.custom.bind(Responser);
export const error = Responser.error.bind(Responser);
export const badRequest = Responser.badRequest.bind(Responser);
export const validationfail = Responser.validationfail.bind(Responser);

// Ensure CommonJS compatibility for existing require() usage
module.exports = Responser;
module.exports.success = success;
module.exports.custom = custom;
module.exports.error = error;
module.exports.badRequest = badRequest;
module.exports.validationfail = validationfail;
