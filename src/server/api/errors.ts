/** Typed HTTP error classes (NotFoundError, UnauthorizedError, ValidationError, etc.) for API responses. */

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation failed") {
    super(422, message, "VALIDATION_ERROR");
  }
}
