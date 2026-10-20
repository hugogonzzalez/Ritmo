const AppError = require('../utils/app-error');

const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((item) => ({
        path: item.path,
        msg: item.message
      }))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID',
      errors: []
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value error',
      errors: [
        {
          field: Object.keys(err.keyValue)[0],
          value: Object.values(err.keyValue)[0]
        }
      ]
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: []
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: process.env.NODE_ENV === 'development'
      ? [{ message: err.message }]
      : []
  });
};

module.exports = {
  errorHandler
};