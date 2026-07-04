const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserStatus,
  getRoles,
  getSheds,
} = require("../controllers/superAdminController");

const { verifyToken, checkRole } = require("../middleware/auth");

// All admin routes require auth + SUPERADMIN role
router.use(verifyToken);
router.use(checkRole("SUPER_ADMIN", "ADMIN"));

router.get("/pending-users", getPendingUsers);
router.get("/all-users", getAllUsers);
router.get("/roles", getRoles);
router.get("/sheds", getSheds);

// Only SUPER_ADMIN can approve/reject
router.post("/approve-user", checkRole("SUPER_ADMIN"), approveUser);
router.post("/reject-user", checkRole("SUPER_ADMIN"), rejectUser);
router.post("/update-status", checkRole("SUPER_ADMIN"), updateUserStatus);

module.exports = router;