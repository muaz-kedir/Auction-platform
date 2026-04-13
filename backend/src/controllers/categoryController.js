const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
try {

const category = await Category.create({
name: req.body.name
});

res.json(category);

} catch (error) {
res.status(500).json({ error: error.message });
}
};

exports.getCategories = async (req, res) => {
try {

const categories = await Category.find();

res.json(categories);

} catch (error) {
res.status(500).json({ error: error.message });
}
};