const validate = (schema, property) => (req, res, next) => {
  try {
    req[property] = schema.parse(req[property]);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateBody = (schema) => validate(schema, "body");
export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");
