const mongoose = require('mongoose');

const everySchema = new mongoose.Schema({
  username: String,
  email: String,
  senha: String,
});

const EveryMind = mongoose.model('EveryMind', everySchema);

module.exports = EveryMind;