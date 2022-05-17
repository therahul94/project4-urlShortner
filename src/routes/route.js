const express = require("express");
const router = express.Router();
const urlController = require("../Controllers/urlController")




router.post("/createShortUrl",urlController.createShortUrl)





module.exports = router;
