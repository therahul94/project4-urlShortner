// const express = ("express")
const urlModel = require("../Models/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")

const isValid = function(value){
    if(typeof value === 'undefined' || typeof value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const createShortUrl = async function(req,res){

    const baseUrl = `http://localhost:3000`;
    const longUrl = req.body.longUrl

    if(!isValid(longUrl)){
        return res.status(400).send({status: false, message: "longUrl is not present"})
    }

    if(!validUrl.isUri(baseUrl)){
        return res.status(400).send({status: false, message: "baseUrl you entered is not a valid url format"})
    }

    if(!validUrl.isUri(longUrl)){
        return res.status(400).send({status:false,message:"longUrl you entered is not a valid url format"})
    }

    const isLongUrlExist = await urlModel.findOne({longUrl: longUrl})
    if(isLongUrlExist){
        return res.status(200).send({status: true, Data: isLongUrlExist})
    }

    const urlCode = shortId.generate().toLowerCase()
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


