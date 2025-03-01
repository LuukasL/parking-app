const successResponse = (data, message = "Success") => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

const errorResponse = (message, statusCode = 500, errors = null) => ({
  success: false,
  message,
  statusCode,
  errors,
  timestamp: new Date().toISOString(),
});

module.exports = {
  successResponse,
  errorResponse,
};
