const mongoose = require('mongoose');

const PDFSchema = new mongoose.Schema({
    filename: String,
    content: String,
});

const PDFModel = mongoose.model('PDF', PDFSchema);

module.exports = PDFModel;