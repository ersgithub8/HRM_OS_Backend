var { expressjwt: jwt } = require("express-jwt");
require("dotenv").config();
const secret = process.env.JWT_SECRET;

function authorize(permission) {
  return [
    // authenticate JWT token and attach user to request object (req.auth)
    jwt({ secret, algorithms: ["HS256"] }),
    // authorize based on user permission
    (req, res, next) => {
      if (permission.length && !req.auth.permissions.includes(permission)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
  ];
}

module.exports = authorize;
