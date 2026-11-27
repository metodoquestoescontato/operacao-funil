(() => {
  "use strict";
  const config = window.FUNIL_CONFIG || {};
  const conversation = document.getElementById("conversation");
  const area = document.getElementById("answerArea");
  const restart = document.getElementById("restart");
  const params = new URLSearchParams(location.search);
  const campaign = (params.get("utm_campaign") || "pmpe").slice(0,80);
  const state = { name: "", material: "", problem: "", time: "", intent: "" };
  let runId = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const bottom = () => { conversation.scrollTop = conversation.scrollHeight; };
  const ts = () => new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  const track = (event, extra={}) => {
    const payload = {event, campaign, ...extra, timestamp:Date.now()};
    try { if (typeof window.fbq==="function") window.fbq("trackCustom",event,extra); } catch {}
    try { window.dispatchEvent(new CustomEvent("funil:event",{detail:payload})); } catch {}
    // Sem backend, os eventos não são persistidos. Não gravar nome nem respostas na URL ou em analytics.
  };
  const bubble = (text, who="bot") => {
    const node=document.createElement("div");node.className="bubble "+who;
    const message=document.createElement("span");message.textContent=text;node.appendChild(message);
    const time=document.createElement("time");time.textContent=ts();node.appendChild(time);
    conversation.appendChild(node);bottom();
  };
  async function say(text, id=runId) {
    if(id!==runId)return;
    const typing=document.createElement("div");typing.className="typing";typing.textContent="•••";typing.setAttribute("aria-label","Digitando");
    conversation.appendChild(typing);bottom();await sleep(config.typingDelayMs || 620);
    typing.remove();if(id!==runId)return;
    bubble(text);
  }
  const clear = () => {area.replaceChildren();};
  function choices(items,handler){
    clear();
    for(const [label,value] of items){
      const b=document.createElement("button");b.type="button";b.className="answer-button";b.textContent=label;
      b.addEventListener("click",()=>{clear();bubble(label,"user");handler(value);});
      area.appendChild(b);
    }
  }
  async function intro(id){
    await say("Fala, futuro policial! 👊",id);
    await say("Aqui é o assistente virtual da Operação Pernambuco. Vou te mostrar como nossas apostilas podem ajudar na preparação para a PMPE.",id);
    await say("Antes, como posso te chamar?",id);
    if(id!==runId)return;
    clear();const form=document.createElement("form");form.className="name-form";
    const input=document.createElement("input");input.placeholder="Seu primeiro nome";input.maxLength=35;input.required=true;input.autocomplete="given-name";input.setAttribute("aria-label","Primeiro nome");
    const send=document.createElement("button");send.textContent="Enviar";send.type="submit";
    form.append(input,send);area.appendChild(form);input.focus();
    form.addEventListener("submit",e=>{
      e.preventDefault();const name=input.value.trim().replace(/\s+/g," ").slice(0,35);
      if(!name)return;state.name=name;clear();bubble(name,"user");track("FunilNomeInformado");qualification(runId);
    });
  }
  async function qualification(id){
    await say(`Prazer, ${state.name}! Você já está estudando para a PMPE?`,id);
    if(id!==runId)return;
    choices([["Sim, já comecei","sim"],["Ainda vou começar","nao"]],async value=>{
      state.intent=value;track("FunilQualificacaoInicio");await say(value==="sim"?"Boa! E como você estuda atualmente?":"Ótimo momento para começar com direcionamento. Você já tem algum material?",runId);askMaterial(runId);
    });
  }
  function askMaterial(id){
    if(id!==runId)return;
    choices([["Já tenho apostilas de outro curso","outro"],["Estudo por videoaulas","video"],["Uso materiais gratuitos","gratis"],["Ainda não tenho material","nenhum"]],async value=>{
      state.material=value;
      const responses={
        outro:"Ter um material já é um começo importante. Nosso objetivo não é pedir que você descarte o que tem, e sim oferecer um complemento estratégico.",
        video:"Videoaulas podem ajudar muito. Apostilas organizadas também facilitam consultas rápidas e revisões.",
        gratis:"Materiais gratuitos são úteis, mas reunir e organizar os conteúdos pode exigir bastante tempo.",
        nenhum:"Começar com um material organizado ajuda a evitar a dispersão entre muitas fontes."
      };
      await say(responses[value],runId);await say("Qual dessas dificuldades mais atrapalha seus estudos?",runId);
      askProblem(runId);
    });
  }
  function askProblem(id){
    if(id!==runId)return;
    choices([["Tenho pouco tempo","tempo"],["Não sei o que priorizar","prioridade"],["Meu material é muito extenso","extenso"],["Preciso praticar mais questões","questoes"]],async value=>{
      state.problem=value;
      const answers={
        tempo:"Então o tempo precisa trabalhar a seu favor: uma preparação organizada facilita priorizar os conteúdos.",
        prioridade:"Uma das maiores dificuldades é transformar o edital em uma sequência clara de estudos.",
        extenso:"Conteúdo amplo pode ser importante, mas é fundamental saber o que revisar primeiro.",
        questoes:"Praticar questões ajuda a conhecer a cobrança da banca e identificar lacunas."
      };
      await say(answers[value],runId);await present(runId);
    });
  }
  async function present(id){
    track("FunilProdutoVisualizado",{material:state.material,problem:state.problem});
    await say("Foi com essa preocupação que organizamos a preparação PMPE: apostilas completas e estratégicas, com conteúdos direcionados e questões da banca AOCP.",id);
    await say("O material fica disponível no aplicativo, para você consultar e organizar seus estudos.",id);
    if(id!==runId)return;
    for(const src of [config.media?.apostila1,config.media?.apostila2].filter(Boolean)){
      const image=document.createElement("img");image.src=src;image.alt="Prévia real da apostila PMPE";image.loading="lazy";image.style.cssText="display:block;max-width:88%;max-height:250px;object-fit:contain;align-self:flex-start;border-radius:12px;background:white;padding:6px";conversation.appendChild(image);bottom();
    }
    if(config.showPrice)await say(`O valor informado para esta oferta é ${config.price}. Quer conversar com nossa equipe?`,id);
    else await say("Quer falar diretamente com nossa equipe para conhecer o acesso e tirar suas dúvidas?",id);
    if(id!==runId)return;
    choices([["Sim, quero falar no WhatsApp","sim"],["Quero entender melhor","duvida"]],async value=>{
      if(value==="duvida"){
        await say("O atendimento humano pode explicar o acesso ao aplicativo, mostrar detalhes das apostilas e responder suas perguntas sem compromisso.",runId);
      }
      finish(runId);
    });
  }
  async function finish(id){
    await say(`${state.name}, preparei uma mensagem para você continuar o atendimento no WhatsApp.`,id);
    if(id!==runId)return;
    clear();
    const button=document.createElement("button");button.type="button";button.className="answer-button primary";button.textContent="Conversar no WhatsApp ↗";
    const note=document.createElement("small");note.style.cssText="display:block;text-align:center;color:#65766e;font-size:11px";
    const valid=/^\d{12,15}$/.test(String(config.whatsappNumber||""));
    note.textContent=valid?"Você será redirecionado para o WhatsApp.":"WhatsApp comercial ainda não configurado.";
    button.disabled=!valid;button.style.opacity=valid?"1":".6";button.addEventListener("click",()=>{
      if(!valid)return;
      track("FunilCliqueWhatsApp",{material:state.material,problem:state.problem});
      const message=[
        "Olá! Vim pelo atendimento virtual da Operação Pernambuco.",
        `Meu nome é ${state.name} e quero saber mais sobre as apostilas PMPE.`,
        `Minha preparação: ${({outro:"já tenho apostilas",video:"uso videoaulas",gratis:"uso materiais gratuitos",nenhum:"ainda não tenho material"})[state.material]||"não informado"}.`,
        `Minha maior dificuldade: ${({tempo:"pouco tempo",prioridade:"definir prioridades",extenso:"material extenso",questoes:"praticar questões"})[state.problem]||"não informado"}.`
      ].join("\n");
      // Não incluir dados pessoais ou UTMs na URL do destino além da mensagem escolhida.
      const url="https://wa.me/"+config.whatsappNumber+"?text="+encodeURIComponent(message);
      window.location.assign(url);
    });
    area.append(button,note);
  }
  function start(){
    runId++;const id=runId;state.name="";state.material="";state.problem="";state.intent="";
    conversation.replaceChildren();clear();const day=document.createElement("div");day.className="day-label";day.textContent="Hoje";conversation.appendChild(day);
    track("FunilInicio");intro(id);
  }
  restart.addEventListener("click",start);
  start();
})();