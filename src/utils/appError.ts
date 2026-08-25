export default class AppError extends Error {
  statusCode: number;
  status: number;
  errorType: string;
  option: unknown;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    option: unknown = null
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = 0;

    this.errorType = `${statusCode}`.startsWith("4")
      ? "failed-Client Error"
      : "error-Server Error";

    this.option = option;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}