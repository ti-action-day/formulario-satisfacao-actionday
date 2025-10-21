/* === FUNÇÃO PARA CAPTURAR PARÂMETROS DA URL === */
function getParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || "";
}

/* === VARIÁVEIS === */
let clienteID = "";
let produtoID = "";

/* === AO CARREGAR A PÁGINA === */
window.addEventListener("DOMContentLoaded", () => {
  clienteID = getParam("c");
  produtoID = getParam("p");

  console.table({
    "🧾 ID do cliente": clienteID || "(vazio)",
    "📦 Produto ID": produtoID || "(vazio)"
  });
});

/* === ENVIO DO FORMULÁRIO === */
document.getElementById("consultoriaForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const feedback = document.getElementById("feedbackMsg");
  feedback.textContent = "⏳ Enviando respostas...";
  feedback.style.color = "#592c82";

  const formData = new FormData(this);
  formData.append("cliente", clienteID);
  formData.append("produto", produtoID);

  try {
    const res = await fetch("https://hook.us1.make.com/jhgz7ulsjpeqxejide9bmyeiu97ncbxs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    if (res.ok) {
      feedback.textContent = "🎉 Respostas enviadas com sucesso! Obrigado por participar.";
      feedback.style.color = "#16a34a";
      this.reset();
    } else {
      feedback.textContent = "⚠️ Ocorreu um erro ao enviar. Tente novamente.";
      feedback.style.color = "#dc2626";
    }
  } catch (err) {
    feedback.textContent = "❌ Erro de conexão. Verifique sua internet.";
    feedback.style.color = "#dc2626";
  }
});
