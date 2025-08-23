const express = require("express");
const router = express.Router();
const { restrict, restrictRole } = require("../middlewares/auth");
const { getFileLogs } = require("../controllers/auditLog");
const {
  uploadFile,
  listFiles,
  getFile,
  deleteFile,
  updateAccess,
  shareFile,
  revokeFile,
  listAllFiles
} = require("../controllers/file");
const { validateBody } = require("../middlewares/validate");
const {
  uploadFileSchema,
  updateAccessSchema,
  shareFileSchema,
  revokeFileSchema
} = require("../validations/file");

router.post("/", restrict, validateBody(uploadFileSchema), uploadFile);
router.get("/", restrict, listFiles);
router.get("/all", restrict, restrictRole(["admin"]), listAllFiles);
router.get("/:id", restrict, getFile);
router.delete("/:id", restrict, deleteFile);
router.patch("/:id/access", restrict, validateBody(updateAccessSchema), updateAccess);
router.post("/:id/share", restrict, validateBody(shareFileSchema), shareFile);
router.post("/:id/revoke", restrict, validateBody(revokeFileSchema), revokeFile);
router.get("/:id/audit", restrict, getFileLogs);

module.exports = router;