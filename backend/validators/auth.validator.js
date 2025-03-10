const { check } = require("express-validator");

exports.registerValidation = [
  check("name", "Name is required").not().isEmpty().trim(),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password must be at least 6 characters").isLength({
    min: 6,
  }),
  check("phone").optional().isMobilePhone(),
  check("role").optional().isIn(["user", "owner"]),
];

exports.loginValidation = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
];
