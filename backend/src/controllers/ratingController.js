const Rating = require("../models/Rating");

exports.addRating = async (req, res) => {
try {

const rating = await Rating.create({
seller: req.body.seller,
buyer: req.user._id,
rating: req.body.rating,
review: req.body.review
});

res.json(rating);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


exports.getSellerRatings = async (req, res) => {
try {

const ratings = await Rating.find({
seller: req.params.id
});

res.json(ratings);

} catch (error) {
res.status(500).json({ error: error.message });
}
}; 