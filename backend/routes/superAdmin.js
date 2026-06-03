const express    = require('express');
const router     = express.Router();
const {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserStatus,
  getRoles,
  getSheds,
} = require('../controllers/superAdminController');

const {
  verifyToken,
  checkRole,
} = require('../middleware/auth');

// All admin routes require auth + SUPERADMIN role
router.use(verifyToken);
router.use(checkRole('SUPER_ADMIN', 'ADMIN'));

router.get('/pending-users',    getPendingUsers);
router.get('/all-users',        getAllUsers);
router.get('/roles',            getRoles);
router.get('/sheds',            getSheds);

// Only SUPERADMIN can approve/reject
router.post('/approve-user',    checkRole('SUPERADMIN'), approveUser);
router.post('/reject-user',     checkRole('SUPERADMIN'), rejectUser);
router.post('/update-status',   checkRole('SUPERADMIN'), updateUserStatus);

module.exports = router;