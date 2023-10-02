function menuOnClick() {
  document.getElementById("menu-bar").classList.toggle("change");
  document.getElementById("nav").classList.toggle("change");
  document.getElementById("menu-bg").classList.toggle("change-bg");
}

const altoContraste = document.querySelector('#alto-contraste')
let darkMode = false
const fonteElement = document.getElementById("fonte");
let fontSize = 20; // Valor inicial da fonte em pixels (por exemplo, 20px)

altoContraste.addEventListener("click", () => {
  if (darkMode === true) {
    darkMode = false
  } else {
    darkMode = true
  }

  alteraCorDeFundo(darkMode)
})


function alteraCorDeFundo(darkMode) {
  const body = document.querySelector('body')
  const texto = document.querySelectorAll(".texto")
  const texto2 = document.querySelector(".texto2")

  if (darkMode === true) {
    body.style.backgroundColor = "#333"
    texto.forEach(function (elemento) {
      elemento.style.color = "#fff"
    })
    // texto.style.color = "#fff"
    texto2.style.color = "#fff"
  } else {
    body.style.backgroundColor = "#f1f1f1"
    texto.forEach(function (elemento) {
      elemento.style.color = "#333"
    })
    // texto.style.color = "#333"
    texto2.style.color = "#333"
  }
}

fonteElement.addEventListener("click", (event) => {
  const clickedElement = event.target;

  if (clickedElement.classList.contains("a-minus")) {
    fontSize -= 2; // Diminui o tamanho da fonte em 2 pixels
  } else if (clickedElement.classList.contains("a-plus")) {
    fontSize += 2; // Aumenta o tamanho da fonte em 2 pixels
  }

  // Atualiza o tamanho da fonte no elemento body
  document.body.style.fontSize = fontSize + "px";
});

document.addEventListener("DOMContentLoaded", function () {
  const pcdSelect = document.getElementById("pcd");
  const vulnerabilidadeInput = document.getElementById("vulnerabilidade");

  pcdSelect.addEventListener("change", function () {
    if (pcdSelect.value === "Sim") {
      vulnerabilidadeInput.style.display = "flex";
    } else {
      vulnerabilidadeInput.style.display = "none";
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const senhaInput = document.getElementById('senha');
  const senhaRequirements = document.getElementById('senha-requirements');
  const lengthRequirement = document.getElementById('length');
  const uppercaseRequirement = document.getElementById('uppercase');
  const numberRequirement = document.getElementById('number');
  const specialRequirement = document.getElementById('special');

  senhaInput.addEventListener('input', function () {
    const senha = senhaInput.value;

    // Verifique o comprimento da senha
    const isLengthValid = senha.length >= 8;
    lengthRequirement.classList.toggle('valid', isLengthValid);
    lengthRequirement.classList.toggle('invalid', !isLengthValid);

    // Verifique se há pelo menos uma letra maiúscula
    const hasUppercase = /[A-Z]/.test(senha);
    uppercaseRequirement.classList.toggle('valid', hasUppercase);
    uppercaseRequirement.classList.toggle('invalid', !hasUppercase);

    // Verifique se há pelo menos um número
    const hasNumber = /\d/.test(senha);
    numberRequirement.classList.toggle('valid', hasNumber);
    numberRequirement.classList.toggle('invalid', !hasNumber);

    // Verifique se há pelo menos um caractere especial
    const hasSpecial = /[@$!%*?&]/.test(senha);
    specialRequirement.classList.toggle('valid', hasSpecial);
    specialRequirement.classList.toggle('invalid', !hasSpecial);
  });

  // Adicione um evento blur (quando o foco sai) ao campo de senha
  senhaInput.addEventListener('blur', function () {
    senhaRequirements.style.display = 'none';
  });

  // Adicione um evento focus (quando o foco entra) ao campo de senha
  senhaInput.addEventListener('focus', function () {
    senhaRequirements.style.display = 'block';
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const senhaInput = document.getElementById('senha');
  const senhaRequirements = document.getElementById('senha-requirements');

  senhaInput.addEventListener('input', function () {
    // Verifique se o campo de senha não está vazio
    if (senhaInput.value.trim() === '') {
      senhaRequirements.style.display = 'none';
    } else {
      senhaRequirements.style.display = 'block';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const nomeInput = document.getElementById('nome');
  const nomeWarning = document.getElementById('nome-warning');

  nomeInput.addEventListener('input', function () {
    const nome = nomeInput.value;

    // Verifique se o "nome" contém números
    const hasNumbers = /\d/.test(nome);

    if (hasNumbers) {
      nomeWarning.style.display = 'block'; // Exibe o aviso
    } else {
      nomeWarning.style.display = 'none'; // Oculta o aviso
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const emailInput = document.getElementById('email');
  const emailWarning = document.getElementById('email-warning');

  emailInput.addEventListener('input', function () {
    const email = emailInput.value;

    // Verifique se o email contém o símbolo "@"
    const hasAtSymbol = email.includes('@');

    if (!hasAtSymbol) {
      emailWarning.style.display = 'block'; // Exibe o aviso
    } else {
      emailWarning.style.display = 'none'; // Oculta o aviso
    }
  });
});

// Obtém referências para o elemento de mensagem de erro
const mensagemErro = document.getElementById('mensagem-erro');

// Função para mostrar a mensagem de erro
function mostrarErro() {
  mensagemErro.style.display = 'block';
}

// Função para ocultar a mensagem de erro
function ocultarErro() {
  mensagemErro.style.display = 'none';
}

// Adicione esta função para verificar se o e-mail já existe
function verificarEmail() {
  const email = document.getElementById('email').value; // Substitua 'email' pelo ID do campo de e-mail

  // Verifique se o campo de e-mail já está preenchido
  if (email) {
    // Você pode mostrar a mensagem de erro aqui se o campo de e-mail já estiver preenchido
    mostrarErro();
  } else {
    // Se o campo de e-mail estiver vazio, oculte a mensagem de erro
    ocultarErro();

    // Continuar com a verificação de e-mail no servidor
    // ...
  }
}
