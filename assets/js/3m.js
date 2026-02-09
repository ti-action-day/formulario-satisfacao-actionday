function getParam(p){
  return new URLSearchParams(window.location.search).get(p) || "";
}

let clienteID="", produtoID="";

function setupCheckboxLimits(){
  document.querySelectorAll(".checkbox-block").forEach(block=>{
    const max=+block.dataset.max||2;
    const note=document.querySelector(`[data-note="${block.dataset.group}"]`);
    const boxes=[...block.querySelectorAll("input[type=checkbox]")];

    function update(){
      const checked=boxes.filter(b=>b.checked);
      boxes.forEach(b=>b.disabled=checked.length>=max&&!b.checked);
      if(note){
        note.textContent=
          checked.length===0?`Você pode selecionar até ${max} opções.`:
          checked.length>=max?`Limite atingido (${max}/${max}).`:
          `Selecionadas: ${checked.length}.`;
      }
    }
    boxes.forEach(b=>b.addEventListener("change",update));
    update();
  });
}

window.addEventListener("DOMContentLoaded",()=>{
  clienteID=getParam("c");
  produtoID=getParam("p");
  setupCheckboxLimits();
});

document.getElementById("csatForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const feedback=document.getElementById("feedbackMsg");
  feedback.textContent="⏳ Enviando...";

  const data={},fd=new FormData(e.target);
  for(const[k,v]of fd.entries()){
    if(k.endsWith("[]")){
      const key=k.replace("[]","");
      data[key]=data[key]||[];
      data[key].push(v);
    }else{
      data[k]=v;
    }
  }

  data.cliente=clienteID;
  data.produto=produtoID;

  try{
    const r=await fetch("https://hook.us1.make.com/1vwb1hdrdhnc1fun6vgpkhdssos5a0vi",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
    feedback.textContent=r.ok?"🎉 Respostas enviadas com sucesso!":"⚠️ Erro ao enviar.";
    if(r.ok){
      e.target.reset();
      setupCheckboxLimits();
    }
  }catch{
    feedback.textContent="❌ Erro de conexão.";
  }
});
