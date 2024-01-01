const asyncHandler = require("express-async-handler")
const User = require("../Models/userModel.js");
const generateToken = require("../config/generateToken.js");

const registerUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { name, email, password, pic } = req.body

    if (!name || !email || !password) {
        res.status(400)
        throw new Error("Please Enter All fields!")
    }

    // if user Already exist
    const userExists = await User.findOne({ email })
    console.log(userExists);
    if (userExists) {
        res.status(400);
        throw new Error("User Already Exists")
    }

    const user = await User.create({
        name,
        email,
        password,
        pic
    })

    if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
    } else {
        res.status(409)
        throw new Error("Failed to Create The User")
    }
})

const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            pic: user.pic,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
})

const allUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
            // This or says search either of the similarities between the queries
            // agar naam me match ho rh h toh naam bhejo ya email 
            $or: [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
            ],
        }
        : {};
        console.log(req.user);
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
})

module.exports = { registerUser, authUser, allUsers };