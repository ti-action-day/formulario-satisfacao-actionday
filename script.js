/* === INICIALIZAÇÃO DO EMAILJS === */
(function () {
  emailjs.init("U2BDgiHeRnlYMLNeh");
})();

/* === FUNÇÃO PARA CAPTURAR QUALQUER PARÂMETRO DA URL === */
function getParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || "";
}

/* === VARIÁVEIS GLOBAIS === */
let clienteID = "";
let clienteNome = "Cliente não identificado";
let produtoID = "";

/* === QUANDO A PÁGINA CARREGAR === */
window.addEventListener("DOMContentLoaded", async () => {
  // Preenche automaticamente as UTMs (se existirem)
  const utmFields = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term"
  ];
  utmFields.forEach(utm => {
    const value = getParam(utm);
    const field = document.getElementById(utm);
    if (field && value) field.value = value;
  });

  // Captura os parâmetros c (cliente) e p (produto)
  clienteID = getParam("c");
  produtoID = getParam("p");

  // Busca o arquivo JSON com os clientes (precisa estar na mesma pasta)
  try {
    const response = await fetch("clientes.json");
    const clientesData = await response.json();

    if (clienteID && clientesData[clienteID]) {
      clienteNome = clientesData[clienteID].nome;
      console.log("✅ Cliente encontrado:", clienteNome);
    } else if (clienteID) {
      console.warn("⚠️ ID informado, mas não encontrado no JSON:", clienteID);
    } else {
      console.log("ℹ️ Nenhum ID de cliente informado na URL.");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar clientes.json:", error);
  }

  // Mostra informações para debug
  console.table({
    "🧾 ID do cliente": clienteID || "(vazio)",
    "👤 Nome do cliente": clienteNome,
    "📦 Produto ID": produtoID || "(vazio)"
  });
});

/* === ENVIO DO FORMULÁRIO === */
document.getElementById("consultoriaForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const feedback = document.getElementById("feedbackMsg");
  const formData = new FormData(this);

  // --- 1️⃣ ENVIO VIA EMAILJS (com nome do cliente) ---
  const emailData = Object.fromEntries(formData.entries());
  emailData.cliente = clienteNome || "Cliente não identificado"; // nome visível
  emailData.produto = ""; // produto não vai no email

  console.table({
    "📩 Enviando e-mail com nome": emailData.cliente,
    "🧾 ID do cliente": clienteID
  });

  await emailjs
    .send("service_i6lj8o8", "template_eyrl3ax", emailData)
    .then(() => console.log("✅ Email enviado com sucesso!"))
    .catch(err => console.error("❌ Erro ao enviar email:", err));

  // --- 2️⃣ ENVIO PARA WEBHOOK (IDs originais) ---
  const webhookData = Object.fromEntries(formData.entries());
  webhookData.cliente = clienteID; // envia ID real
  webhookData.produto = produtoID; // envia ID real (ou vazio)

  fetch("https://hook.us1.make.com/jhgz7ulsjpeqxejide9bmyeiu97ncbxs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookData),
  })
    .then(res => {
      if (res.ok) {
        feedback.textContent = "🎉 Respostas enviadas com sucesso! Obrigado por participar.";
        feedback.style.color = "#16a34a";
        this.reset();
      } else {
        feedback.textContent = "⚠️ Ocorreu um erro ao enviar. Tente novamente.";
        feedback.style.color = "#dc2626";
      }
    })
    .catch(() => {
      feedback.textContent = "❌ Erro de conexão. Verifique sua internet.";
      feedback.style.color = "#dc2626";
    });
});
