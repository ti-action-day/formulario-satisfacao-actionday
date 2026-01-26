/* === FUNÇÃO PARA CAPTURAR PARÂMETROS === */
function getParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || "";
}

let clienteID = "";
let produtoID = "";

/* === CAPTURA DE UTMs SIMPLES === */
window.addEventListener("DOMContentLoaded", () => {
  clienteID = getParam("c");
  produtoID = getParam("p");

  console.table({
    "🧾 Cliente ID": clienteID || "(vazio)",
    "📦 Produto ID": produtoID || "(vazio)"
  });
});

/* === ENVIO DO FORM === */
const form = document.getElementById("consultoriaForm");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const feedback = document.getElementById("feedbackMsg");
    feedback.textContent = "⏳ Enviando...";
    feedback.style.color = "#4B5563";

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    data.cliente = clienteID;
    data.produto = produtoID;

    try {
      const res = await fetch(
        "https://hook.us1.make.com/jhgz7ulsjpeqxejide9bmyeiu97ncbxs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

      if (res.ok) {
        feedback.textContent = "🎉 Respostas enviadas com sucesso!";
        feedback.style.color = "#16a34a";
        this.reset();

        // GTM - evento personalizado
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "form_submit",
          form_name: "Formulario Consultoria Action Day",
          cliente_id: clienteID,
          produto_id: produtoID
        });
      } else {
        feedback.textContent = "⚠️ Ocorreu um erro ao enviar.";
        feedback.style.color = "#dc2626";
      }
    } catch (error) {
      feedback.textContent = "❌ Erro de conexão.";
      feedback.style.color = "#dc2626";
      console.error("Erro:", error);
    }
  });
} else {
  console.warn('Formulário "consultoriaForm" não encontrado.');
}
