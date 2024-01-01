const jwt = require("jsonwebtoken");
const User = require("../Models/userModel.js");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            //decodes token id
            const decoded = jwt.verify(token, process.env.SECRET);
            req.user = await User.findById(decoded.id).select("-password"); // here req.user is created
            next();
        } catch (error) {
            res.status(401);
            throw new Error("Not authorized, token failed "+error);
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

module.exports = { protect };