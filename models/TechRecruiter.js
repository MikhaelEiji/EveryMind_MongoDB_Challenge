const mongoose = require('mongoose');

const techSchema = new mongoose.Schema({
  username: String,
  email: String,
  senha: String,
});

const TechRecruiter = mongoose.model('TechRecruiter', techSchema);

module.exports = TechRecruiter;