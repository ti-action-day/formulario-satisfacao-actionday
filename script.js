document.addEventListener("DOMContentLoaded", function () {
  function getParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param) || "";
  }

  const cliente = getParam("c");
  const produto = getParam("p");

  document.getElementById("cliente").value = cliente;
  document.getElementById("produto").value = produto;

  const form = document.getElementById("consultoriaForm");
  const feedback = document.getElementById("feedbackMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.textContent = "⏳ Enviando respostas...";
    feedback.style.color = "#555";

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("https://hook.us1.make.com/jhgz7ulsjpeqxejide9bmyeiu97ncbxs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        feedback.textContent = "🎉 Respostas enviadas com sucesso! Obrigado por participar.";
        feedback.style.color = "#16a34a";
        form.reset();
      } else {
        throw new Error();
      }
    } catch {
      feedback.textContent = "⚠️ Erro ao enviar. Tente novamente.";
      feedback.style.color = "#dc2626";
    }
  });
});
