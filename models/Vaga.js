const mongoose = require('mongoose');

const vagaSchema = new mongoose.Schema({
  titulo: String,
  empresa: String,
  cargo_de_atuacao: String,
  salario: String,
  local: String,
  descricao: String,
  tech:String,
});

module.exports = mongoose.model('Vaga', vagaSchema);