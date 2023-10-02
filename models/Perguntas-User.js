const mongoose = require('mongoose');

const perguntaUsersSchema = new mongoose.Schema({
  pergunta: String,
});

const PerguntasUser = mongoose.model('PerguntasUser', perguntaUsersSchema);

module.exports = PerguntasUser;