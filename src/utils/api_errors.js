class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somethinf=g went Wrong",
    errors = [],
    statck = ""
  ) {
    super(message),
      (this.statusCode = statusCode),
      (this.data = null),
      (this.message = message);
    this.success = false;
    this.errors = errors;
  }
}

export { ApiError };