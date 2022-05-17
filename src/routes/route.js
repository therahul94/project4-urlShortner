const express = require("express");
const router = express.Router();
const urlController = require("../Controllers/urlController")




router.post("/createShortUrl",urlController.createShortUrl)
router.get("/:urlCode", urlController.getUrl)




module.exports = router;
