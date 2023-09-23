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
  const texto = document.querySelector(".texto")
  const texto2 = document.querySelector(".texto2")

  if (darkMode === true) {
    body.style.backgroundColor = "#333"
    texto.style.color = "#fff"
    texto2.style.color = "#fff"
  } else {
    body.style.backgroundColor = "#f1f1f1"
    texto.style.color = "#333"
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