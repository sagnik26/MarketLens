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
