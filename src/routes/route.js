const express = require("express");
const router = express.Router();
const urlController = require("../Controllers/urlController")
// const redirectController = require("../Controllers/redirectController")



router.post("/url/shorten",urlController.createShortUrl)
router.get("/:urlCode", urlController.getUrl)




module.exports = router;
