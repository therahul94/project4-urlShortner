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
     
    // const cachedUrlData = await GET_ASYNC (`${longUrl}`)
    // console.log(cachedUrlData)
    // if(cachedUrlData) return res.status(200).send({status: true, Data: JSON.parse(cachedUrlData)})

    const isLongUrlExist = await urlModel.findOne({longUrl: longUrl})
    if(isLongUrlExist){
        return res.status(200).send({status: true, Data: isLongUrlExist})
    }

    const urlCode = shortId.generate().toLowerCase()
    const shortUrl = baseUrl+"/"+urlCode

    // await SET_ASYNC (`${urlCode}`, JSON.stringify(isLongUrlExist))

    const finalData = {
        urlCode : urlCode,
        longUrl: longUrl,
        shortUrl: shortUrl
    }
    const createUrl = await urlModel.create(finalData)
    // await SET_ASYNC (`${longUrl}`, JSON.stringify(longUrl))
    // await SET_ASYNC (`${urlCode}`, JSON.stringify(longUrl))
    res.status(201).send({status:true,data:createUrl})

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

// const getUrl = async function (req, res) {
//     const getDataFromCache = await GET_ASYNC(`${req.params.urlCode}`);
//     if (getDataFromCache) {
//       // console.log(getDataFromCache)
//       return res.status(302).redirect(getDataFromCache);
      
//     } 
//     else {
//       const url_code = req.params.urlCode;
//       const urlData = await urlModel.findOne({ urlCode: url_code }).select({_id:0,longUrl:1});
//       if (!urlData) {
//         return res
//           .status(404)
//           .send({
//             status: false,
//             message:
//               "No URL is found with the given code. Please enter valid URL code",
//           })}
//       await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlData.longUrl))
//       res.status(302).redirect(urlData.longUrl);
//       // console.log(urlData.longUrl)
//         }
//   };



module.exports = {createShortUrl, getUrl}


