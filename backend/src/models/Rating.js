const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
{
seller: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

buyer: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

rating: Number,

review: String
},
{ timestamps: true }
);

module.exports = mongoose.model("Rating", ratingSchema);