const Withdraw = require("../models/Withdraw");
const Wallet = require("../models/Wallet");


// request withdraw
exports.requestWithdraw = async (req, res) => {
try {

const { amount } = req.body;

const wallet = await Wallet.findOne({
user: req.user._id
});

if (!wallet || wallet.balance < amount) {
return res.status(400).json({
message: "Insufficient balance"
});
}

wallet.balance -= amount;
await wallet.save();

const withdraw = await Withdraw.create({
user: req.user._id,
amount
});

res.json({
message: "Withdraw request sent",
withdraw
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// admin approve withdraw
exports.approveWithdraw = async (req, res) => {
try {

const withdraw = await Withdraw.findById(req.params.id);

withdraw.status = "APPROVED";

await withdraw.save();

res.json(withdraw);

} catch (error) {
res.status(500).json({ error: error.message });
}
};