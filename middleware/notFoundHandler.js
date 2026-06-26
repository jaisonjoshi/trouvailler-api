export default function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}
