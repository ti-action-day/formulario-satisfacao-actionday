/* =========================================================
   CONFIG
========================================================= */
const WEBHOOK_URL = "https://hook.us1.make.com/q5nf9xu58laiwdgnshecrjswrg57nfws";
const TIMEOUT_MS = 12000;

/* =========================================================
   MAPAS (nota -> texto) - escalas
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
   1) UTMs (case-insensitive)
========================================================= */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function getUTMs() {
  const params = new URLSearchParams(window.location.search);
  const lowered = {};

  params.forEach((v, k) => {
    lowered[String(k).toLowerCase()] = String(v || "").trim();
  });

  const utms = {};
  UTM_KEYS.forEach((k) => {
    utms[k] = lowered[k] || "";
  });

  return utms;
}

/* =========================================================
   2) Captura C/c e P/p (robusto)
   Suporta:
   - ?C=123&P=999
   - ?c=123&p=999
   - ?C=123P=999 (sem &)
========================================================= */
function getCustomParamsCP() {
  const rawSearch = window.location.search || "";
  const params = new URLSearchParams(rawSearch);

  // Caso normal
  let C = (params.get("c") || params.get("C") || "").trim();
  let P = (params.get("p") || params.get("P") || "").trim();
  if (C || P) return { C, P };

  // Fallback: casos colados (C=...P=...)
  const raw = rawSearch.replace(/^\?/, "");

  const glued = raw.match(/(?:^|&)(?:c|C)=([^&]*?)(?:p|P)=([^&]*)/);
  if (glued) {
    C = decodeURIComponent(glued[1] || "").trim();
    P = decodeURIComponent(glued[2] || "").trim();
    return { C, P };
  }

  // fallback extra: tenta capturar mesmo sem estar 100% “bonito”
  const c2 = raw.match(/(?:^|&)(?:c|C)=([^&]*)(?:&|$)/);
  const p2 = raw.match(/(?:^|&)(?:p|P)=([^&]*)(?:&|$)/);

  if (c2) C = decodeURIComponent(c2[1] || "").trim();
  if (p2) P = decodeURIComponent(p2[1] || "").trim();

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
   4) Helpers de texto e valores
========================================================= */
function normalizeText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapTextByName(name, score) {
  const key = String(score || "").trim();
  if (!key) return "";

  if (name === "q1_clareza") return MAP_Q1[key] || "";
  if (name === "q2_alinhamento") return MAP_Q2[key] || "";
  if (name === "q3_confianca") return MAP_Q3[key] || "";

  return "";
}

function getFieldValue(formEl, name) {
  const checked = formEl.querySelector(`input[name="${name}"]:checked`);
  if (checked) return (checked.value || "").trim();

  const field = formEl.querySelector(`[name="${name}"]`);
  if (field) return (field.value || "").trim();

  return "";
}

/* =========================================================
   5) Captura automática: TODAS as perguntas e respostas
   - Lê o texto real do label.q-title (pergunta)
   - Descobre o campo pelo name dentro do bloco
   - Pega a resposta (radio marcado ou valor do textarea/input)
========================================================= */
function collectQuestionsAndAnswers(formEl) {
  const questions = [];
  const blocks = Array.from(formEl.querySelectorAll(".question"));

  blocks.forEach((block, index) => {
    const titleEl = block.querySelector("label.q-title");
    const pergunta = normalizeText(titleEl ? titleEl.innerText : "");

    // Descobre o name “principal” da pergunta (o primeiro campo com name)
    const anyField =
      block.querySelector("input[name]") ||
      block.querySelector("textarea[name]") ||
      block.querySelector("select[name]");

    if (!anyField) return;

    const name = anyField.getAttribute("name") || "";

    // Valor (radio marcado ou valor do campo)
    const resposta = getFieldValue(formEl, name);

    // Para escalas (q1/q2/q3), gerar texto correspondente
    const respostaTexto = mapTextByName(name, resposta) || null;

    // Guardar também o tipo do campo (ajuda no Make, BI, etc.)
    let tipo = "text";
    if (anyField.tagName === "TEXTAREA") tipo = "textarea";
    if (anyField.tagName === "SELECT") tipo = "select";
    if (anyField.tagName === "INPUT") tipo = (anyField.getAttribute("type") || "text").toLowerCase();

    questions.push({
      ordem: index + 1,
      id: name,
      tipo,
      pergunta,
      resposta,
      resposta_texto: respostaTexto
    });
  });

  return questions;
}

/* =========================================================
   6) Boot + Submit
========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedbackForm");
  if (!form) {
    console.warn("Form #feedbackForm não encontrado. Verifique o id no HTML.");
    return;
  }

  const utms = getUTMs();
  const cp = getCustomParamsCP();
  const clienteID = cp.C || "";
  const produtoID = cp.P || "";

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

    // ✅ Captura automática (todas as perguntas do HTML)
    const perguntas = collectQuestionsAndAnswers(this);

    // ✅ (Opcional) compatibilidade com seus campos antigos
    const q1 = getFieldValue(this, "q1_clareza");
    const q2 = getFieldValue(this, "q2_alinhamento");
    const q3 = getFieldValue(this, "q3_confianca");
    const q4 = getFieldValue(this, "q4_aprofundar");
    const q5 = getFieldValue(this, "q5_sensacao");

    const q1Text = mapTextByName("q1_clareza", q1);
    const q2Text = mapTextByName("q2_alinhamento", q2);
    const q3Text = mapTextByName("q3_confianca", q3);

    // =========================================================
    // Payload para o Make (organizado)
    // =========================================================
    const payload = {
      empresa: "BU Solutions",
      etapa: "Planejamento",

      // ✅ organizado: tudo em um array
      perguntas,

      // ✅ compatibilidade (se você já usa esses campos no Make)
      clareza_score: q1,
      clareza_text: q1Text,

      alinhamento_score: q2,
      alinhamento_text: q2Text,

      confianca_score: q3,
      confianca_text: q3Text,

      aprofundar: q4,
      sensacao: q5,

      q1_clareza: q1,
      q1_clareza_text: q1Text,
      q2_alinhamento: q2,
      q2_alinhamento_text: q2Text,
      q3_confianca: q3,
      q3_confianca_text: q3Text,
      q4_aprofundar: q4,
      q5_sensacao: q5,

      // ✅ tracking (C/c e P/p)
      c: clienteID,
      p: produtoID,
      C: clienteID,
      P: produtoID,

      // ✅ UTMs
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
