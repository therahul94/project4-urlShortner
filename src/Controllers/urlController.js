// const express = ("express")
const urlModel = require("../Models/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
const redis = require("redis");
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    18972,
  "redis-18972.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Quuj2YnV5KnWIets4KOm0dtDqxOa27g2", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});




//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function(value){
    if(typeof value === 'undefined' || typeof value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    return true
}



const createShortUrl = async function(req,res){

    const baseUrl = `http://localhost:3000`;
    let longUrl = req.body.longUrl


    if(!isValid(longUrl)){
        return res.status(400).send({status: false, message: "longUrl is not present"})
    }

    longUrl = longUrl.trim()

    if(!validUrl.isUri(baseUrl)){
        return res.status(400).send({status: false, message: "baseUrl you entered is not a valid url format"})
    }

    if(!validUrl.isUri(longUrl)){
        return res.status(400).send({status:false,message:"Invalid longUrl"})
    }
     
    // const cachedUrlData = await GET_ASYNC (`${longUrl}`)
    // if(cachedUrlData) return res.status(200).send({status: true, Data: JSON.parse(cachedUrlData)})

    const isLongUrlExist = await urlModel.findOne({longUrl: longUrl})
    if(isLongUrlExist){
        return res.status(200).send({status: true, Data: isLongUrlExist})
    }


    const urlCode = shortId.generate().toLowerCase()

    // const cachedUrlCode = await GET_ASYNC (`${urlCode}`)
    // if(cachedUrlCode) return res.status(200).send({status: true, message: "urlCode is already present in DB. Please hit this API again."})

    const isUrlCodeExist = await urlModel.findOne({urlCode: urlCode})
    if(isUrlCodeExist){
        return res.status(200).send({status: true, message: "urlCode is already present in DB. Please hit this API again."})
    }


    const shortUrl = baseUrl+"/"+urlCode

    const finalData = {
        urlCode : urlCode,
        longUrl: longUrl,
        shortUrl: shortUrl
    }
    const createUrl = await urlModel.create(finalData)

    if(createUrl) {
        await SET_ASYNC (`${longUrl}`, JSON.stringify(finalData))
        await SET_ASYNC (`${urlCode}`, JSON.stringify(longUrl))
        res.status(201).send({status:true,data:finalData})
    }
}


const getUrl = async function (req, res){
    try{
        const urlCode = req.params.urlCode
        const isCachedLongUrl = await GET_ASYNC (urlCode)
        const parsedLongUrl = JSON.parse(isCachedLongUrl)

        if(parsedLongUrl){
            return res.redirect(parsedLongUrl)
        }
        else{
            const findUrl = await urlModel.findOne({urlCode: urlCode})
            if(!findUrl)
                return res.status(404).send({status: false, message: "UrlCode not found"})
            await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl.longUrl))
            return res.redirect(findUrl.longUrl)
        }
    }
    catch (error){
        console.log(error)
        return res.status(500).send({status: false, message: error.message})
    }
}



module.exports = {createShortUrl, getUrl}


