const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

amount: Number,

status: {
type: String,
enum: ["PENDING", "APPROVED", "REJECTED"],
default: "PENDING"
}
},
{ timestamps: true }
);

module.exports = mongoose.model("Withdraw", withdrawSchema);