/** Operational error with an HTTP status code — thrown by services/controllers. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(message, 403);
  }
  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409);
  }
}
