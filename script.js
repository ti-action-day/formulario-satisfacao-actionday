/* === INICIALIZAÇÃO DO EMAILJS === */
/* Substitua pelo seu USER_ID do painel do EmailJS */
(function(){
  emailjs.init("U2BDgiHeRnlYMLNeh");
})();

/* === FUNÇÃO PARA CAPTURAR OS PARÂMETROS UTM DA URL === */
/* Ela lê a URL e devolve o valor de cada parâmetro UTM (ou vazio se não existir) */
function getUTM(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || "";
}

/* === QUANDO A PÁGINA CARREGAR === */
window.addEventListener("DOMContentLoaded", () => {
  // Preenche automaticamente os campos ocultos com as UTMs da URL
  document.getElementById("utm_source").value = getUTM("utm_source");
  document.getElementById("utm_medium").value = getUTM("utm_medium");
  document.getElementById("utm_campaign").value = getUTM("utm_campaign");
  document.getElementById("utm_content").value = getUTM("utm_content");
  document.getElementById("utm_term").value = getUTM("utm_term");
});

/* === ENVIO DO FORMULÁRIO === */
document.getElementById("consultoriaForm").addEventListener("submit", function(e) {
  e.preventDefault(); // Impede o comportamento padrão de recarregar a página

  const feedback = document.getElementById("feedbackMsg"); // Elemento para mensagens de sucesso/erro

  /* --- 1️⃣ ENVIO VIA EMAILJS --- */
  /* Envia o conteúdo do formulário por e-mail para o responsável */
  emailjs.sendForm("service_i6lj8o8", "template_eyrl3ax", this)
    .then(() => console.log("✅ Email enviado com sucesso!"))
    .catch(err => console.error("❌ Erro ao enviar email:", err));

  /* --- 2️⃣ ENVIO PARA WEBHOOK (MAKE/N8N) --- */
  /* Transforma os dados do formulário em JSON */
  const dados = Object.fromEntries(new FormData(this).entries());

  /* Envia para seu endpoint personalizado (por exemplo, um webhook do Make) */
  fetch("https://hook.us1.make.com/jhgz7ulsjpeqxejide9bmyeiu97ncbxs", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(dados)
  })
  .then(res => {
    if (res.ok) {
      feedback.textContent = "🎉 Respostas enviadas com sucesso! Obrigado por participar.";
      this.reset(); // Limpa o formulário
    } else {
      feedback.textContent = "⚠️ Ocorreu um erro ao enviar. Tente novamente.";
    }
  })
  .catch(() => {
    feedback.textContent = "❌ Erro de conexão. Verifique sua internet.";
  });
});
