const { check } = require("express-validator");

exports.updateProfileValidation = [
  check("name").optional().trim().notEmpty(),
  check("email").optional().isEmail(),
  check("phone").optional().isMobilePhone(),
];

exports.addVehicleValidation = [
  check("registrationNumber", "Registration number is required")
    .trim()
    .notEmpty()
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage("Invalid registration number format"),
];
