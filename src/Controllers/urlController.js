const express = ("express")
const urlModel = require("../Models/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")



const createShortUrl = async function(req,res){
    const baseUrl = `http://localhost:3000`;
    const longUrl = req.body.longUrl
    if(!validUrl.isUri(longUrl)){
        return res.status(400).send({status:false,message:"longUrl you entered is not a valid url format"})
    }
    const urlCode = shortId.generate()
    const shortUrl = baseUrl+"/"+urlCode
    const finalData = {
        urlCode : urlCode,
        longUrl: longUrl,
        shortUrl: shortUrl
    }
    const createUrl = await urlModel.create(finalData)
    res.status(201).send({status:true,data:createUrl})
}

const getUrl= async function(req,res){
    const urlCode = req.params.urlCode
    const isurlCode = await urlModel.findOne({urlCode:urlCode})
    res.redirect(isurlCode.longUrl)
}

module.exports.createShortUrl = createShortUrl
module.exports.getUrl = getUrl


