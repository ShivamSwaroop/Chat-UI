import mongoose from "mongoose";

const userSchema = new  mongoose.Schema({
    name: {type:String},
    email: {type: String, unique: true},
    hashPassword: {type:String},
    image: {type: String},
    provider: {type: String, default: "credentials"}
},
{timestamps: true});

const User =  mongoose.models.User ||mongoose.model("User", userSchema);

export default User;