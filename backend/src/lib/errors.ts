export type NotFoundError = Error & { isNotFoundError: true };

export function createNotFoundError(message: string): NotFoundError {
  const error = new Error(message) as NotFoundError;
  error.name = "NotFoundError";
  error.isNotFoundError = true;
  return error;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof Error && (error as Partial<NotFoundError>).isNotFoundError === true;
}
