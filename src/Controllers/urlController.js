const urlModel = require("../Models/urlModel")
const shortId = require("shortid")
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


const isValidChecker = function(value){
    if(typeof value === 'undefined' || typeof value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    return true
}



const createShortUrl = async function(req,res){

    const baseUrl = `http://localhost:3000`;
    let longUrl = req.body.longUrl

    //checking longUrl field is empty or not
    if(!isValidChecker(longUrl)){
        return res.status(400).send({status: false, message: "longUrl is not present"})
    }

    // If the longUrl field have some value then we will use trim()
    longUrl = longUrl.trim()

    // Checking the longurl includes "//" or not 
    if(!(longUrl.includes("//"))){
        return res.status(400).send({status:false,message:"Invalid longUrl"})
    }

    //dividing longUrl into 2 parts scheme and uri, Scheme is the part which is come before the "//" and uri is come after the "//"
    const urlParts = longUrl.split("//")
    const scheme = urlParts[0]
    const uri = urlParts[1]

    // Uri should also inclued the "."
    if(!(uri.includes("."))){
        return res.status(400).send({status:false,message:"Invalid longUrl"})
    }
    const uriParts = uri.split(".")
    
    // Scheme should be http: or https: and also we are checking that the length of uriPart, before "." and after "." should not be equal to 0 means it should have some texts.
    if(!( ((scheme == "http:") || (scheme == "https:")) && (uriParts[0].trim().length) && (uriParts[1].trim().length) )){
        return res.status(400).send({status:false,message:"Invalid longUrl"})
    }

    //Checking if the longurl is already present in DB then we will show the whole data.
    const isLongUrlExist = await urlModel.findOne({longUrl: longUrl}).select({urlCode:1,longUrl:1,shortUrl:1,_id:0})
    if(isLongUrlExist){
        return res.status(200).send({status: true, Data: isLongUrlExist})
    }

    //generating urlCode of length 6 using inbuilt .generate()
    const urlCode = shortId.generate().toLowerCase()

    //if the urlCode exist in DB then we will show that the URLCODE is already in DB. 
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
        //setting longUrl in the cache
        await SET_ASYNC (`${urlCode}`, JSON.stringify(longUrl))
        res.status(201).send({status:true,data:finalData})
    }
}


const getUrl = async function (req, res){
    try{
        const urlCode = req.params.urlCode

        // .isValid() is an inbuilt function.
        if(!shortId.isValid(urlCode)){
            return res.status(400).send({status: false, message: "Invalid urlCode"})
        }

        //getting the data from cache...
        const isCachedLongUrl = await GET_ASYNC (urlCode)
        const parsedLongUrl = JSON.parse(isCachedLongUrl)

        if(parsedLongUrl){
            return res.status(302).redirect(parsedLongUrl)
        }
        else{
            const findUrl = await urlModel.findOne({urlCode: urlCode})
            if(!findUrl)
                return res.status(404).send({status: false, message: "UrlCode not found"})
            else{
                await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl.longUrl))
                return res.status(302).redirect(findUrl.longUrl)
            }
        }
    }
    catch (error){
        console.log(error)
        return res.status(500).send({status: false, message: error.message})
    }
}



module.exports = {createShortUrl, getUrl}


