/**
 * Express middleware helper that validates the request body using a Zod schema.
 * Replaces inline service-layer schema parsing with router-level execution.
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};
