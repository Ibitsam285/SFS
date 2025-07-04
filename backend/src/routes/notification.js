const router = require("express").Router();
const { restrict, restrictRole } = require("../middlewares/auth");
const {
  getMyNotifications,
  markNotificationRead,
  markAllRead,
  adminSendNotification,
} = require("../controllers/notification");

router.get("/", restrict, getMyNotifications);
router.patch("/:id/read", restrict, markNotificationRead);
router.patch("/read-all", restrict, markAllRead);
router.post("/admin", restrict, restrictRole(["admin"]), adminSendNotification);

module.exports = router;