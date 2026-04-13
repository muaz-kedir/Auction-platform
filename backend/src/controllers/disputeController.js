const Dispute = require("../models/Dispute");

exports.createDispute = async (req, res) => {
try {

const dispute = await Dispute.create({
auction: req.body.auction,
user: req.user._id,
reason: req.body.reason
});

res.json(dispute);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


exports.resolveDispute = async (req, res) => {
try {

const dispute = await Dispute.findById(req.params.id);

dispute.status = "RESOLVED";

await dispute.save();

res.json(dispute);

} catch (error) {
res.status(500).json({ error: error.message });
}
};