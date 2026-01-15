/* =========================================================
   CONFIG
========================================================= */
const WEBHOOK_URL = "https://hook.us1.make.com/q5nf9xu58laiwdgnshecrjswrg57nfws";
const TIMEOUT_MS = 12000;

/* =========================================================
   MAPAS (nota -> texto)
========================================================= */
const MAP_Q1 = {
  "1": "Muito pouco claro",
  "2": "Pouco claro",
  "3": "Razoavelmente claro",
  "4": "Claro",
  "5": "Muito claro"
};

const MAP_Q2 = {
  "1": "Nada alinhado",
  "2": "Pouco alinhado",
  "3": "Parcialmente alinhado",
  "4": "Bem alinhado",
  "5": "Totalmente alinhado"
};

const MAP_Q3 = {
  "1": "Nenhuma confiança",
  "2": "Baixa confiança",
  "3": "Confiança moderada",
  "4": "Alta confiança",
  "5": "Confiança total"
};

/* =========================================================
   1) UTMs (padrão)
========================================================= */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function getUTMs() {
  const params = new URLSearchParams(window.location.search);
  const utms = {};
  UTM_KEYS.forEach((k) => (utms[k] = (params.get(k) || "").trim()));
  return utms;
}

/* =========================================================
   2) Captura C=xxxxP=yyyy (se existir)
========================================================= */
function getCustomParamsCP() {
  const raw = window.location.search.replace("?", "");
  let C = "", P = "";

  if (raw.includes("C=") && raw.includes("P=")) {
    const match = raw.match(/C=([^P]+)P=(.+)/);
    if (match) {
      C = decodeURIComponent(match[1] || "");
      P = decodeURIComponent(match[2] || "");
    }
  }

  return { C, P };
}

/* =========================================================
   3) Fetch com timeout
========================================================= */
async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* =========================================================
   4) Helper: pega valor do radio marcado ou campo normal
========================================================= */
function getValue(formEl, name) {
  const checked = formEl.querySelector(`input[name="${name}"]:checked`);
  if (checked) return (checked.value || "").trim();

  const field = formEl.querySelector(`[name="${name}"]`);
  if (field) return (field.value || "").trim();

  return "";
}

/* =========================================================
   5) Helpers de texto
========================================================= */
function mapText(mapObj, score) {
  const key = String(score || "").trim();
  return mapObj[key] || "";
}

/* =========================================================
   6) Boot + Submit
========================================================= */
let utms = {};
let clienteID = "";
let produtoID = "";

window.addEventListener("DOMContentLoaded", () => {
  utms = getUTMs();
  const cp = getCustomParamsCP();
  clienteID = cp.C;
  produtoID = cp.P;

  const form = document.getElementById("feedbackForm");
  if (!form) {
    console.warn("Form #feedbackForm não encontrado. Verifique o id no HTML.");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const feedback = document.getElementById("feedbackMsg");
    const submitBtn = document.getElementById("submitBtn") || this.querySelector('button[type="submit"]');

    const setLoading = (on) => {
      if (!submitBtn) return;
      if (on) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "Enviando...";
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Enviar Feedback";
      }
    };

    if (feedback) {
      feedback.textContent = "⏳ Enviando...";
      feedback.style.color = "#4B5563";
    }
    setLoading(true);

    // =========================================================
    // Captura dos campos (names do HTML)
    // =========================================================
    const q1 = getValue(this, "q1_clareza");        // 1..5
    const q2 = getValue(this, "q2_alinhamento");    // 1..5 (novo name!)
    const q3 = getValue(this, "q3_confianca");      // 1..5
    const q4 = getValue(this, "q4_aprofundar");
    const q5 = getValue(this, "q5_sensacao");

    // textos
    const q1Text = mapText(MAP_Q1, q1);
    const q2Text = mapText(MAP_Q2, q2);
    const q3Text = mapText(MAP_Q3, q3);

    // =========================================================
    // Payload para o Make
    // =========================================================
    const payload = {
      empresa: "BU Solutions",
      etapa: "Planejamento",

      // ✅ NOVO (score + texto)
      clareza_score: q1,
      clareza_text: q1Text,

      alinhamento_score: q2,
      alinhamento_text: q2Text,

      confianca_score: q3,
      confianca_text: q3Text,

      aprofundar: q4,
      sensacao: q5,

      // ✅ BACKUP (se quiser manter compatibilidade)
      q1_clareza: q1,
      q1_clareza_text: q1Text,

      q2_alinhamento: q2,
      q2_alinhamento_text: q2Text,

      q3_confianca: q3,
      q3_confianca_text: q3Text,

      q4_aprofundar: q4,
      q5_sensacao: q5,

      // tracking
      cliente: clienteID || "",
      produto: produtoID || "",
      ...utms,

      // meta
      page_url: window.location.href,
      enviado_em: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    console.log("PAYLOAD -> MAKE:", payload);

    // 1) tenta fetch
    try {
      const res = await fetchWithTimeout(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      if (feedback) {
        feedback.textContent = "🎉 Feedback enviado com sucesso!";
        feedback.style.color = "#16a34a";
      }
      this.reset();
      setLoading(false);
      return;

    } catch (err) {
      console.warn("Fetch falhou/travou:", err);
    }

    // 2) fallback sendBeacon
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const ok = navigator.sendBeacon(WEBHOOK_URL, blob);

      if (ok) {
        if (feedback) {
          feedback.textContent = "🎉 Feedback enviado com sucesso!";
          feedback.style.color = "#16a34a";
        }
        this.reset();
      } else {
        throw new Error("sendBeacon retornou false");
      }
    } catch (err2) {
      console.error("Envio falhou:", err2);
      if (feedback) {
        feedback.textContent = "❌ Não foi possível enviar. Verifique a conexão e tente novamente.";
        feedback.style.color = "#dc2626";
      }
    } finally {
      setLoading(false);
    }
  });
});
