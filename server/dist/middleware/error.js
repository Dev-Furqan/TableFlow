import { ZodError } from 'zod';
export const notFound = (req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
export const errorHandler = (err, req, res, _next) => { if (err instanceof ZodError)
    return res.status(422).json({ message: 'Validation failed', errors: err.flatten() }); const status = err.status || ((err.name === 'ValidationError' || err.code === 11000) ? 422 : 500); if (status === 500)
    console.error(err); res.status(status).json({ message: status === 500 ? 'An unexpected error occurred' : err.message, requestId: req.headers['x-request-id'], details: err.details }); };
//# sourceMappingURL=error.js.map