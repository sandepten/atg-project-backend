const { check, validationResult } = require("express-validator");

exports.validateUser = [
  check("username")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Username is Missing!")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3 to 20 characters"),
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid!"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is Missing!")
    .isLength({ min: 8 })
    .withMessage("Password should be longer than 8 characters"),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (!error.length) return next();
  res.status(400).json({ success: false, error: error[0].msg });
};
