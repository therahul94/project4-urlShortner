const urlModel = require("../Models/urlModel")

const getUrl = async function (req, res){
    try{
        const urlCode = req.params.urlCode

        const findUrl = await urlModel.findOne({urlCode: urlCode})
        if(!findUrl)
            return res.status(404).send({status: false, message: "UrlCode not found"})
        
        return res.redirect(findUrl.longUrl)
    }
    catch (error){
        console.log(error)
        return res.status(500).send({status: false, message: error.message})
    }
}

module.exports = {getUrl}