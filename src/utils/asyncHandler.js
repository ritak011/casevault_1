/**
 * Wraps an async controller so any thrown error / rejected promise
 * is forwarded to next(err) -> errorMiddleware, instead of crashing
 * the process or requiring try/catch in every controller.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
