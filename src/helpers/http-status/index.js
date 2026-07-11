const httpStatus = {
  statusOK: {
    code: 200,
    message: "OK",
  },
  statusCreated: {
    code: 201,
    message: "Created",
  },
  statusNoContent: {
    code: 204,
    message: "No Content",
  },
  statusBadRequest: {
    code: 400,
    message: "Bad Request",
  },
  statusUnauthorized: {
    code: 401,
    message: "Unauthorized",
  },
  statusForbidden: {
    code: 403,
    message: "Forbidden",
  },
  statusNotFound: {
    code: 404,
    message: "Not Found",
  },
  statusRequestTimeout: {
    code: 408,
    message: "Request Timeout",
  },
  statusConflict: {
    code: 409,
    message: "Conflict",
  },
  statusTooManyRequests: {
    code: 429,
    message: "Too Many Requests",
  },
  statusInternalServerError: {
    code: 500,
    message: "Internal Server Error",
  },
  statusBadGateway: {
    code: 502,
    message: "Bad Gateway",
  },
  statusServiceUnavailable: {
    code: 503,
    message: "Service Unavailable",
  },
  statusGatewayTimeout: {
    code: 504,
    message: "Gateway Timeout",
  },
};

module.exports = { httpStatus };
