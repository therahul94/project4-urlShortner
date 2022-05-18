// const express = ("express")
const urlModel = require("../Models/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
const redis = require("redis");
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    11451,
  "redis-11451.c281.us-east-1-2.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("tfPwf9ZRtEAhkq6iZ6JmBnV2IN3wcLY6", function (err) {
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
     
    const cachedUrlData = await GET_ASYNC(`${longUrl}`)
    if(cachedUrlData) return res.status(200).send({status: true, Data: cachedUrlData})

    const isLongUrlExist = await urlModel.findOne({longUrl: longUrl})
    if(isLongUrlExist){
        const cachedUrlData = await SET_ASYNC ()
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


module.exports.createShortUrl = createShortUrl


