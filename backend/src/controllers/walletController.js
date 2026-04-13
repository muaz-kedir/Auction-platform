const Wallet = require("../models/Wallet");


// get my wallet
exports.getMyWallet = async (req, res) => {
try {

let wallet = await Wallet.findOne({ user: req.user._id });

if (!wallet) {
wallet = await Wallet.create({
user: req.user._id
});
}

res.json(wallet);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// deposit money
exports.deposit = async (req, res) => {
try {

const { amount } = req.body;

let wallet = await Wallet.findOne({ user: req.user._id });

if (!wallet) {
wallet = await Wallet.create({
user: req.user._id
});
}

wallet.balance += amount;

await wallet.save();

res.json({
message: "Deposit successful",
wallet
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};