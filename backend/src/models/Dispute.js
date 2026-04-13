const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
{
auction: {
type: mongoose.Schema.Types.ObjectId,
ref: "Auction"
},

user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

reason: String,

status: {
type: String,
enum: ["OPEN", "RESOLVED"],
default: "OPEN"
}
},
{ timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);