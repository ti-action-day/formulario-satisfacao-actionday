/* === FUNÇÃO PARA CAPTURAR PARÂMETROS === */
function getParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || "";
}

window.addEventListener("DOMContentLoaded", () => {
  const clienteID = getParam("c");
  const produtoID = getParam("p");

  console.table({
    "🧾 Cliente ID": clienteID || "(vazio)",
    "📦 Produto ID": produtoID || "(vazio)"
  });

  // GTM - evento de "thank_you_page_view"
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "thank_you_page_view",
    page_name: "Obrigado - Form Consultoria Action Day",
    cliente_id: clienteID,
    produto_id: produtoID
  });
});
