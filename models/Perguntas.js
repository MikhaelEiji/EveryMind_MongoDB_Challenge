const mongoose = require('mongoose');

const perguntasSchema = new mongoose.Schema({
  topico: String,
  resposta: String,
});

const Perguntas = mongoose.model('Perguntas', perguntasSchema);

module.exports = Perguntas;
