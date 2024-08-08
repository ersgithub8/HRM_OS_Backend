const authorize = require("../../utils/authorize");
const express = require("express");
const {
  login,
  register,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
  changepassword,
  users_forgot_password,
  users_otpmatch,
  users_resetpassword,
  updateSingleUserprofile,
  updateSingleUserphone,
  validate,
  updateSingleStatus,
  updateSingleUserdocument,
  deletePermanentUser
} = require("./user.controller.js");
const userRoutes = express.Router();

userRoutes.post("/login", login); // public route
userRoutes.post("/register",
  //  authorize("create-user"),
  register); // public route
userRoutes.post("/validate",
  validate);
// userRoutes.get("/", authorize("readAll-user"), getAllUser); // readUser only
// userRoutes.get("/:id", authorize("readSingle-user"), getSingleUser); // authenticated users can read their own and readUser
// userRoutes.put("/:id", authorize("update-user"), updateSingleUser); // authenticated users can update their own and updateUser
// userRoutes.put("/profile/:id", authorize("update-user"), updateSingleUserprofile); // authenticated users can update their own and updateUser
// userRoutes.put("/phone/:id", authorize("update-user"), updateSingleUserphone); // authenticated users can update their own and updateUser
// userRoutes.patch("/:id", authorize("delete-user"), deleteSingleUser); // deleteUser only
// userRoutes.patch("/deleteUser/:id", authorize("delete-user"), deletePermanentUser); // Permanent Delete user
// userRoutes.post("/changepassword", authorize(""), changepassword);
// userRoutes.post("/forgot", users_forgot_password); // public route
// userRoutes.post("/otp", users_otpmatch); // public route
// userRoutes.post("/restpassword", users_resetpassword); // public route
// userRoutes.put("/status/:id", authorize("update-user"), updateSingleStatus);
// userRoutes.put("/doc/:id", authorize("update-user"), updateSingleUserdocument); // authenticated users can update their own and updateUser


userRoutes.get("/", getAllUser); // readUser only
userRoutes.get("/:id", getSingleUser); // authenticated users can read their own and readUser
userRoutes.put("/:id", updateSingleUser); // authenticated users can update their own and updateUser
userRoutes.put("/profile/:id", updateSingleUserprofile); // authenticated users can update their own and updateUser
userRoutes.put("/phone/:id", updateSingleUserphone); // authenticated users can update their own and updateUser
userRoutes.patch("/:id", deleteSingleUser); // deleteUser only
userRoutes.patch("/deleteUser/:id", deletePermanentUser); // Permanent Delete user
userRoutes.post("/changepassword", changepassword);
userRoutes.post("/forgot", users_forgot_password); // public route
userRoutes.post("/otp", users_otpmatch); // public route
userRoutes.post("/restpassword", users_resetpassword); // public route
userRoutes.put("/status/:id", updateSingleStatus);
userRoutes.put("/doc/:id", updateSingleUserdocument); // authenticated users can update their own and updateUser



module.exports = userRoutes;
