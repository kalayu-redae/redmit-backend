export default class AppError extends Error {
    statusCode;
    status;
    errorType;
    option;
    isOperational;
    constructor(message, statusCode, option = null) {
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
