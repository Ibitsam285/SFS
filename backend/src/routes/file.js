const express = require("express");
const router = express.Router();
const { restrict } = require("../middlewares/auth");
const {
  uploadFile,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
  updateAccess,
  shareFile,
  revokeFile
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
router.get("/:id", restrict, getFile);
router.get("/:id/download", restrict, downloadFile);
router.delete("/:id", restrict, deleteFile);
router.patch("/:id/access", restrict, validateBody(updateAccessSchema), updateAccess);
router.post("/:id/share", restrict, validateBody(shareFileSchema), shareFile);
router.post("/:id/revoke", restrict, validateBody(revokeFileSchema), revokeFile);

module.exports = router;