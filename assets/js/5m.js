function getParam(p){
  return new URLSearchParams(window.location.search).get(p) || "";
}

let clienteID = "", produtoID = "";

window.addEventListener("DOMContentLoaded", ()=>{
  clienteID = getParam("c");
  produtoID = getParam("p");
});

document.getElementById("csatForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const feedback = document.getElementById("feedbackMsg");
  feedback.textContent = "⏳ Enviando...";

  const data = {};
  const fd = new FormData(e.target);

  for (const [k, v] of fd.entries()){
    data[k] = v;
  }

  // params
  data.cliente = clienteID;
  data.produto = produtoID;

  try{
    const r = await fetch("https://hook.us1.make.com/upjaqm9dzmo0bol6heua3gsjg5uqv4f6", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });

    feedback.textContent = r.ok ? "🎉 Respostas enviadas com sucesso!" : "⚠️ Erro ao enviar.";

    if(r.ok){
      e.target.reset();
    }
  }catch(err){
    feedback.textContent = "❌ Erro de conexão.";
  }
});
