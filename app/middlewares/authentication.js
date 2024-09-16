const jwt = require('jsonwebtoken');
const { getenv } = require('../Utils/common');
const Responser = require('../response');
const model = require('../models/index');
const { USERSTATUS } = require('../../config/custom.config');

const authenticate = (req, res, next) => {
    let token = req.headers.authorization; // Assuming the token is sent in the 'Authorization' header
    let response;
    if (!token) {
        response = Responser.custom("R401");
        return res.status(response.statusCode).send(response.data);
    }
    token = token.replace("Bearer ", "");
    jwt.verify(token, getenv("JWT_SECRET_KEY"), async (err, decoded) => {
        if (err) {
            response = Responser.custom("R401");
        }else if (decoded.email) {
            const userData = await model.user.findOne({
                where: {
                    email: decoded.email
                },
            });
            if (userData && userData.is_email_verified && userData.status == USERSTATUS.ACTIVE && userData.is_active) {
                req.user = userData; // Add the decoded user information to the request object
                next();
            }else{
                response = Responser.custom("R401");
            }
        } else {
            response = Responser.custom("R401");
        }
        return res.status(response.statusCode).send(response.data);
    });
}
module.exports = authenticate;