(() => {
  "use strict";
  const config = window.FUNIL_CONFIG || {};
  const conversation = document.getElementById("conversation");
  const area = document.getElementById("answerArea");
  const restart = document.getElementById("restart");
  const params = new URLSearchParams(location.search);
  const x1 = params.get("modo") === "x1";
  const campaign = (params.get("utm_campaign") || "pmpe").slice(0,80);
  const state = { name: "", material: "", problem: "", time: "", intent: "" };
  let runId = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const bottom = () => { conversation.scrollTop = conversation.scrollHeight; };
  const ts = () => new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  const track = (event, extra={}) => {
    extra = {...extra, mode:x1?"x1":"direto"};
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
    conversation.appendChild(typing);bottom();await sleep(Math.min(1900, Math.max(420, (config.typingDelayMs || 620) * .55 + text.length * 9)));
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
    if(x1){
      await say("Nossa equipe te encaminhou para conhecer melhor o material do Arsenal PMPE.",id);
      await say("Vou mostrar como as apostilas e questões podem ajudar na sua preparação. Antes, quero entender um pouco sobre seus estudos.",id);
      if(id===runId)await qualificationX1(id);
      return;
    }
    await say("Aqui é o assistente virtual da Arsenal PMPE. Vou te mostrar como nossas apostilas podem ajudar na preparação para a PMPE.",id);
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
  async function question(id,key,prompt,options,replies={}){
    await say(prompt,id);
    if(id!==runId)return null;
    track("FunilEtapa",{step:key});
    return new Promise(resolve=>choices(options,async value=>{
      if(id!==runId)return resolve(null);
      state[key]=value;
      track("FunilResposta",{step:key});
      if(replies[value])await say(replies[value],id);
      resolve(id===runId?value:null);
    }));
  }
  async function qualificationX1(id){
    if(!await question(id,"material","Como você está se preparando para a PMPE atualmente?",[["Tenho material e gosto dele","outro"],["Tenho material, mas não estou satisfeito","insatisfeito"],["Uso videoaulas","video"],["Uso materiais gratuitos","gratis"],["Ainda não tenho material","nenhum"]],{
      outro:"Excelente. Nossa proposta não exige abandonar o que já funciona: você pode comparar e complementar sua preparação.",
      insatisfeito:"Comprar outro material só faz sentido quando ele resolve o que está faltando no atual.",
      video:"Videoaulas ajudam na compreensão, mas apostilas podem facilitar a revisão sem precisar assistir novamente à aula.",
      gratis:"O desafio dos materiais dispersos é selecionar, organizar e revisar o conteúdo relevante.",
      nenhum:"Começar com teoria e questões organizadas pode ajudar a evitar perder tempo procurando materiais."
    }))return;
    await say("O edital já está na praça há algum tempo. Agora, além de estudar, é importante saber onde concentrar seus esforços.",id);
    if(!await question(id,"priority","Você sabe quais assuntos merecem mais atenção nas provas da AOCP?",[["Sim, tenho prioridades claras","claro"],["Tenho algumas dúvidas","parcial"],["Ainda não sei identificar","nao"]],{
      claro:"Ótimo. Um bom material complementar precisa respeitar sua estratégia e acrescentar valor.",
      parcial:"Imagine ter apostilas completas que também destacam os assuntos prioritários, sem precisar escolher entre cobertura e direcionamento.",
      nao:"Sem um critério de prioridade, você pode dedicar muito tempo a assuntos menos relevantes e deixar outros importantes para depois."
    }))return;
    if(!await question(id,"problem","Qual situação mais representa sua preparação hoje?",[["Tenho pouco tempo","tempo"],["Não sei o que priorizar","prioridade"],["Meu material é muito extenso","extenso"],["Preciso praticar mais questões","questoes"],["Quero apenas conhecer o material","nenhuma"]],{
      tempo:"A ideia é facilitar o uso do tempo disponível, reunindo teoria, pontos prioritários e prática.",
      prioridade:"O diferencial é estudar com direcionamento para a prova, sem abrir mão das apostilas completas.",
      extenso:"Não se trata de trocar conteúdo completo por um resumo superficial. A proposta é destacar o que merece atenção dentro da teoria.",
      questoes:"Resolver questões da própria banca permite identificar como ela cobra a teoria e onde você precisa melhorar.",
      nenhuma:"Você pode comparar nossa proposta com o que já utiliza, sem compromisso."
    }))return;
    if(!await question(id,"practice","Com que frequência você resolve questões da AOCP?",[["Frequentemente","frequente"],["De vez em quando","ocasional"],["Raramente ou nunca","raro"]],{
      frequente:"Excelente. Ter teoria e questões no mesmo ambiente pode facilitar a revisão dos erros.",
      ocasional:"A prática junto à teoria ajuda a transformar leitura em preparação para a prova.",
      raro:"Conhecer o estilo da banca é importante: saber a teoria e reconhecer como ela é cobrada são habilidades diferentes."
    }))return;
    await say("Foi pensando nessa combinação que desenvolvemos o Arsenal PMPE: apostilas completas, direcionamento estratégico e questões da banca em um aplicativo.",id);
    if(!await question(id,"solution","Qual desses diferenciais faria mais sentido para você?",[["Apostilas completas com assuntos prioritários","teoria"],["Questões direcionadas à AOCP","questoes"],["Teoria e questões em um único aplicativo","ambos"],["Quero comparar com meu material atual","atendido"]]))return;
    await say(({teoria:"Vou mostrar como a teoria é apresentada e destacada nas páginas reais.",questoes:"Além da prática, vale conhecer a estrutura da teoria que acompanha sua preparação.",ambos:"Você poderá conhecer a proposta de reunir estudo e prática no mesmo ambiente.",atendido:"Compare as páginas reais com seu material e avalie se existe espaço para complementar seus estudos."})[state.solution],id);
    if(id===runId)await present(id);
  }
  async function qualification(id){
    if(!await question(id,"intent",`Prazer, ${state.name}! Conquistar uma vaga na PMPE é uma prioridade para você hoje?`,[["Sim, é meu objetivo","sim"],["Estou avaliando essa oportunidade","avaliando"]]))return;
    if(!await question(id,"material","Como você está se preparando atualmente?",[["Já tenho um material e gosto dele","outro"],["Tenho material, mas não estou satisfeito","insatisfeito"],["Uso videoaulas","video"],["Uso materiais gratuitos","gratis"],["Ainda não tenho material","nenhum"]],{
      outro:"Ótimo! Não é necessário abandonar um material que funciona. Podemos avaliar se existe espaço para complementar sua preparação.",
      insatisfeito:"Entendi. Vale identificar o que está faltando antes de investir em outro material.",
      video:"Videoaulas podem ajudar bastante. Um material escrito também pode facilitar consultas e revisões.",
      gratis:"Materiais gratuitos podem ser úteis. Vamos entender se a seleção e organização deles estão funcionando para você.",
      nenhum:"Entendi. Vamos identificar o que seria mais útil para começar com direcionamento."
    }))return;
    if(!await question(id,"priority","Você consegue identificar quais assuntos merecem mais atenção nas provas da AOCP?",[["Sim, tenho prioridades claras","claro"],["Tenho algumas dúvidas","parcial"],["Ainda não sei identificar","nao"]],{
      claro:"Excelente. Nesse caso, um material complementar só faz sentido se acrescentar algo à sua estratégia.",
      parcial:"Conhecer a incidência dos assuntos pode ajudar a distribuir melhor seu tempo.",
      nao:"Sem critérios de prioridade, pode ser difícil decidir onde concentrar seus esforços."
    }))return;
    if(!await question(id,"problem","Qual situação mais representa sua preparação hoje?",[["Tenho pouco tempo","tempo"],["Não sei o que priorizar","prioridade"],["Meu material é muito extenso","extenso"],["Preciso praticar mais questões","questoes"],["Não tenho nenhuma dessas dificuldades","nenhuma"]],{
      tempo:"Com tempo limitado, organizar teoria e prática pode facilitar a rotina.",
      prioridade:"Estudar muito nem sempre resolve a dúvida sobre o que estudar primeiro.",
      extenso:"Um material completo pode ser útil sem deixar de destacar os assuntos prioritários.",
      questoes:"Questões da banca ajudam a conhecer seu estilo de cobrança e identificar lacunas.",
      nenhuma:"Que bom! Vamos verificar se nossa proposta realmente acrescentaria algo aos seus estudos."
    }))return;
    if(!await question(id,"practice","Com que frequência você resolve questões da própria AOCP?",[["Frequentemente","frequente"],["De vez em quando","ocasional"],["Raramente ou nunca","raro"]],{
      frequente:"Ótimo hábito. Vale comparar se o nosso material complementa o que você já pratica.",
      ocasional:"Integrar questões à teoria pode facilitar uma prática mais regular.",
      raro:"Conhecer o estilo de cobrança da banca pode ajudar a orientar sua preparação."
    }))return;
    if(!await question(id,"solution","O que seria mais útil em um material complementar para você?",[["Apostilas completas com assuntos prioritários","teoria"],["Questões direcionadas à AOCP","questoes"],["Teoria e questões em um único aplicativo","ambos"],["Meu material atual já me atende","atendido"]]))return;
    if(state.solution==="atendido"){
      await say("Se seu material já atende às suas necessidades, não precisa comprar outro. Você pode conhecer nossa proposta e comparar, sem compromisso.",id);
    }else{
      await say(({teoria:"Nossa proposta é reunir apostilas completas com direcionamento estratégico.",questoes:"Nossa proposta inclui questões da banca junto ao conteúdo de estudo.",ambos:"É justamente essa combinação de teoria e prática em um só ambiente que buscamos oferecer."})[state.solution],id);
    }
    if(id===runId)await present(id);
  }
  async function present(id){
    track("FunilProdutoVisualizado");
    await say(x1?"Agora vou te mostrar nossa proposta para a PMPE.":`${state.name}, agora vou te mostrar nossa proposta para a PMPE.`,id);
    await say("São apostilas completas, com direcionamento para os assuntos relevantes da prova.",id);
    await say("Além da teoria, você encontra questões da banca AOCP para colocar o conhecimento em prática.",id);
    await say("E tudo fica reunido em um único aplicativo, facilitando suas consultas e revisões.",id);
    if(id!==runId)return;
    const previews=[{src:config.media?.apostila1,label:"Conheça uma página da apostila"},{src:config.media?.apostila2,label:"Veja mais detalhes do material"}].filter(p=>p.src);
    if(previews.length){
      await say("Separei algumas imagens do material para você conhecer. Toque em uma delas para ampliar.",id);
      if(id!==runId)return;
      for(const {src,label} of previews){
        const card=document.createElement("div");card.className="product-preview bubble bot";
        const button=document.createElement("button");button.type="button";button.className="preview-open";button.setAttribute("aria-label",label+" — ampliar");
        const image=document.createElement("img");image.src=src;image.alt=label;image.loading="lazy";
        const caption=document.createElement("span");caption.textContent=label+" · Toque para ampliar";
        button.append(image,caption);card.append(button);
        image.addEventListener("error",()=>card.remove(),{once:true});
        button.addEventListener("click",()=>{
          track("FunilPreviaAmpliada");
          const dialog=document.createElement("dialog");dialog.className="preview-dialog";
          const close=document.createElement("button");close.type="button";close.textContent="Fechar ×";close.className="preview-close";
          const full=document.createElement("img");full.src=src;full.alt=label;
          dialog.append(close,full);document.body.append(dialog);
          close.addEventListener("click",()=>dialog.close());
          dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
          dialog.addEventListener("close",()=>{dialog.remove();if(button.isConnected)button.focus()},{once:true});
          dialog.showModal();close.focus();
        });
        conversation.appendChild(card);bottom();
      }
    }
    if(x1){
      await say("Observe os destaques, esquemas e organização das páginas. A proposta é facilitar a compreensão e a revisão, não apenas entregar arquivos para você acumular.",id);
      await say("Mesmo que você já tenha outro material, pode avaliar se o Arsenal PMPE acrescenta direcionamento e prática à sua preparação.",id);
      const interest=await question(id,"interest","Depois de conhecer o material, como você prefere continuar?",[["Tenho interesse em adquirir","comprar"],["Quero saber o valor e as condições","valor"],["Tenho dúvidas sobre o material","duvida"],["Ainda estou avaliando","avaliando"]]);
      if(!interest||id!==runId)return;
      await say("Você pode retomar o atendimento com nossa equipe para conhecer as condições de acesso e esclarecer suas dúvidas.",id);
      if(id===runId)await finish(id);
      return;
    }
    if(config.showPrice)await say(`O valor informado para esta oferta é ${config.price}. Quer conversar com nossa equipe?`,id);
    else await say("Quer falar diretamente com nossa equipe para conhecer o acesso e tirar suas dúvidas?",id);
    if(id!==runId)return;
    choices([["Sim, quero falar no WhatsApp","sim"],["Quero entender melhor","duvida"]],async value=>{
      if(value==="duvida"){
        await say("O atendimento humano pode explicar o acesso ao aplicativo, mostrar detalhes das apostilas e responder suas perguntas sem compromisso.",id);
      }
      if(id===runId)finish(id);
    });
  }
  async function finish(id){
    await say(x1?"Tudo pronto! Toque abaixo para voltar ao atendimento no WhatsApp.":`${state.name}, preparei uma mensagem para você continuar o atendimento no WhatsApp.`,id);
    if(id!==runId)return;
    clear();
    const button=document.createElement("button");button.type="button";button.className="answer-button primary";button.textContent=x1?"Retomar meu atendimento":"Conversar pelo WhatsApp"; const wa=document.createElement("span");wa.setAttribute("aria-hidden","true");wa.textContent="☎";wa.className="wa-symbol";button.prepend(wa);
    const note=document.createElement("small");note.style.cssText="display:block;text-align:center;color:#65766e;font-size:11px";
    const valid=/^\d{12,15}$/.test(String(config.whatsappNumber||""));
    note.textContent=valid?"Você será redirecionado para o WhatsApp.":"WhatsApp comercial ainda não configurado.";
    button.disabled=!valid;button.style.opacity=valid?"1":".6";button.addEventListener("click",()=>{
      if(!valid)return;
      track("FunilCliqueWhatsApp");
      const message=x1?["Olá! Voltei da apresentação do Arsenal PMPE.", "Minha dificuldade: "+({tempo:"pouco tempo",prioridade:"definir prioridades",extenso:"material extenso",questoes:"praticar questões",nenhuma:"quero conhecer o material"}[state.problem]||"não informada")+".", ({comprar:"Tenho interesse em adquirir o material.",valor:"Quero saber o valor e as condições de acesso.",duvida:"Tenho dúvidas sobre o material.",avaliando:"Ainda estou avaliando o material."}[state.interest]||"Quero continuar o atendimento.")].join("\n"):[
        "Olá! Vim pelo atendimento virtual da Arsenal PMPE.",
        `Meu nome é ${state.name} e quero saber mais sobre as apostilas PMPE.`,
        `Minha preparação: ${({outro:"já tenho material e gosto dele",insatisfeito:"tenho material, mas não estou satisfeito",video:"uso videoaulas",gratis:"uso materiais gratuitos",nenhum:"ainda não tenho material"})[state.material]||"não informado"}.`,
        `Minha maior dificuldade: ${({tempo:"pouco tempo",prioridade:"definir prioridades",extenso:"material extenso",questoes:"praticar questões",nenhuma:"nenhuma das dificuldades apresentadas"})[state.problem]||"não informado"}.`
      ].join("\n");
      // Não incluir dados pessoais ou UTMs na URL do destino além da mensagem escolhida.
      const url="https://wa.me/"+config.whatsappNumber+"?text="+encodeURIComponent(message);
      window.location.assign(url);
    });
    area.append(button,note);
  }
  function start(){
    runId++;const id=runId;for(const key of Object.keys(state))state[key]="";
    conversation.replaceChildren();clear();const day=document.createElement("div");day.className="day-label";day.textContent="Hoje";conversation.appendChild(day);
    state.interest="";
    track("FunilInicio");intro(id);
  }
  restart.addEventListener("click",start);
  start();
})();