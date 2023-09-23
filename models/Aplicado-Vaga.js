const mongoose = require('mongoose');

const aplicarSchema = new mongoose.Schema({
  vaga: String,
  tech: String,
  titulo:String,
  nome: String,
  email: String,
  cel: String,
  genero: String,
  vulnerabilidade: String,
  raca: String,
  status: String,
  pdf:
    {
      filename: String,
      content: String,
    },
});

const AplicadoVaga = mongoose.model('AplicadoVaga', aplicarSchema);

module.exports = AplicadoVaga;