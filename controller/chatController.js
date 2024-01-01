const asyncHandler = require("express-async-handler")
const Chat = require("../Models/chatModel")
const User = require("../Models/userModel")

const accessChat = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) {
            console.log("userId Param not sent in request");
            return res.sendStatus(400)
        }

        var isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],

        }).populate("users", "-password")
            .populate("latestMessage")

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name pic email",
        })

        if (isChat.length > 0) {
            res.send(isChat[0])
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId]
            }

            try {
                const createdChat = await Chat.create(chatData);

                const FullChat = await Chat.findOne({ _id: createdChat._id })
                    .populate("users", "-password")

                res.status(200).send(FullChat)
            } catch (error) {
                res.status(400)
                throw new Error(error.message)
            }
        }
    } catch (error) {
        res.status(400)
        throw new Error("Something Wrong" + error)
    }

})


const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatdAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name email pic"
                })
                res.status(200).send(results)
            })
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
       return res.status(400).send({ message: "Please fill all the fields" });
    }
    var users = JSON.parse(req.body.users);
    if (users.length < 2) {
        return res.status(400).send("More than 2 users are required for the GroupChat")
    }

    // also the logged in user also have to be part of that group so add in array
    users.push(req.user)    // this req.user is created at middleware by token

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,// who is creating group and logged in is admin
        })

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const renameGroup = asyncHandler(async (req, res) => {
    try {
        // chatId of group jiska name change krna h aur chatName jo new name rkhna h 
        const { chatId, chatName } = req.body

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName: chatName // since both key and value same we can put only chatName
            }, {
            new: true // by doing this it will return new object with updated chatName value else it will return old ChatName
        }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat) {
            res.status(404)
            throw new Error("Chat Not Found")
        } else {
            res.json(updatedChat)
        }

    } catch (error) {
        res.status(400)
        throw new Error("Something Wrong" + error)

    }
})

const addToGroup = asyncHandler(async (req, res) => {
    try {
        const { chatId, userId } = req.body

        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                //  array me new user ko add krna 
                $push: { users: userId }
            },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!added) {
            res.status(400)
            throw new Error("Chat Not Found")
        } else {
            res.json(added)
        }
    } catch (error) {
        res.status(400)
        throw new Error("Something Wrong" + error)
    }
})

const removeFromGroup = asyncHandler(async (req, res) => {
    try {
        const { chatId, userId } = req.body

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                //  array me new user ko add krna 
                $pull: { users: userId }
            },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!removed) {
            res.status(400)
            throw new Error("Chat Not Found")
        } else {
            res.json(removed)
        }
    } catch (error) {
        res.status(400)
        throw new Error("Something Wrong" + error)
    }
})


module.exports = { addToGroup, renameGroup, accessChat, fetchChats, createGroupChat, removeFromGroup }