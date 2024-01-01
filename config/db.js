const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL,{
        })

        console.log("DB Connected ",conn.connection.host);
    } catch (error) {
        console.log(error.message);
        process.exit()
    }
}

module.exports = connectDB ;