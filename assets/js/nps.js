/* === FUNÇÃO ESPECIAL PARA PEGAR C E P DO JEITO QUE VEM NA URL === */
function getCustomParams() {
  const raw = window.location.search.replace("?", "");

  let C = "";
  let P = "";

  // Caso venha assim: C=xxxxP=yyyy
  if (raw.includes("C=") && raw.includes("P=")) {
    const regex = /C=([^P]+)P=(.+)/;
    const match = raw.match(regex);
    if (match) {
      C = match[1];
      P = match[2];
    }
  }

  return { C, P };
}

let clienteID = "";
let produtoID = "";

/* === CAPTURA C E P QUANDO A PÁGINA CARREGA === */
window.addEventListener("DOMContentLoaded", () => {
  const params = getCustomParams();
  clienteID = params.C;
  produtoID = params.P;
});

/* === ENVIO DO FORMULÁRIO === */
document.getElementById("consultoriaForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const feedback = document.getElementById("feedbackMsg");
  feedback.textContent = "⏳ Enviando...";
  feedback.style.color = "#4B5563";

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  data.cliente = clienteID;
  data.produto = produtoID;

  try {
    const res = await fetch("https://hook.us1.make.com/1ynojqq57cdv56qxbnpel93g5ue8b1r3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      feedback.textContent = "🎉 Respostas enviadas com sucesso!";
      feedback.style.color = "#16a34a";
      this.reset();
    } else {
      feedback.textContent = "⚠️ Ocorreu um erro ao enviar.";
      feedback.style.color = "#dc2626";
    }
  } catch (error) {
    feedback.textContent = "❌ Erro de conexão.";
    feedback.style.color = "#dc2626";
  }
});
