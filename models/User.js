const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  senha: String,

  raca: String,
  genero: String,
  pcd: String,
  vulnerabilidade: String,
  tipo:String,

  // secret2FA: String, // Adicione este campo para armazenar a chave secreta 2FA
  // is2FAEnabled: Boolean, // Adicione um campo para verificar se o 2FA está habilitado para o usuário
});

const User = mongoose.model('User', userSchema);

module.exports = User;
