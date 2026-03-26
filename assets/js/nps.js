/* === FUNÇÃO PARA PEGAR C E P DA URL === */
function getCustomParams() {
  const raw = window.location.search.replace(/^\?/, "");

  let C = "";
  let P = "";

  const params = new URLSearchParams(window.location.search);

  // 1. Formato normal (?c=...&p=...)
  const CParam = params.get("c") || params.get("C") || "";
  const PParam = params.get("p") || params.get("P") || "";

  if (CParam || PParam) {
    return { C: CParam, P: PParam };
  }

  // 2. Formato legado (C=xxxP=yyy)
  const legacyBothMatch = raw.match(/(?:^|&)c=([^&]+?)p=(.+)$/i);
  if (legacyBothMatch) {
    return {
      C: legacyBothMatch[1],
      P: legacyBothMatch[2]
    };
  }

  // 3. Só C (C=xxx)
  const legacyCMatch = raw.match(/(?:^|&)c=(.+)$/i);
  if (legacyCMatch) {
    C = legacyCMatch[1];
  }

  return { C, P };
}

/* === VARIÁVEIS GLOBAIS === */
let clienteID = "";
let produtoID = "";

/* === CAPTURA AO CARREGAR === */
window.addEventListener("DOMContentLoaded", () => {
  const params = getCustomParams();
  clienteID = params.C;
  produtoID = params.P;

  console.log("Cliente:", clienteID);
  console.log("Produto:", produtoID);
});

/* === SUBMIT DO FORM === */
document.getElementById("consultoriaForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const feedback = document.getElementById("feedbackMsg");

  // 🔴 VALIDAÇÃO NPS
  const npsSelecionado = document.querySelector('input[name="nps"]:checked');

  if (!npsSelecionado) {
    feedback.textContent = "⚠️ Por favor, selecione uma nota de 0 a 10 antes de enviar.";
    feedback.style.color = "#dc2626";

    document.querySelector(".nps-scale").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    return;
  }

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
