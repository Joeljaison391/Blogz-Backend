const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err.name === 'ZodError') {
      const formattedErrors = err.errors.map((error) => ({
        path: error.path.join('.'),
        message: error.message,
      }));
      res.status(400).json({ message: 'Validation error', errors: formattedErrors });
    } else if (err.message === 'Validation error') {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  };
  
  module.exports = errorMiddleware;
  