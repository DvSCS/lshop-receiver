async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchToken(email, password) {
  const res = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ address: email, password: password })
  });
  if (!res.ok) throw new Error("Erro de auth no mail.tm");
  const data = await res.json();
  return data.token;
}

async function fetchMessages(token) {
  const res = await fetch("https://api.mail.tm/messages", {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Erro ao buscar mensagens");
  const data = await res.json();
  return Array.isArray(data) ? data : (data["hydra:member"] || []);
}

async function fetchMessageDetail(token, id) {
  const res = await fetch(`https://api.mail.tm/messages/${id}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Erro ao buscar detalhe");
  return await res.json();
}

const VERCEL_URL = "https://lshop-receiver.vercel.app";
const SYNC_SECRET = "SYNC_SECRET_123456";

async function syncAllAccounts() {
  console.log(`[${new Date().toLocaleTimeString()}] Iniciando ciclo de sincronização...`);
  try {
    // Busca contas diretamente da Vercel (assim não precisa do banco de dados localmente)
    const accountsRes = await fetch(`${VERCEL_URL}/api/admin/sync`);
    if (!accountsRes.ok) throw new Error("Falha ao buscar contas da Vercel");
    const { accounts } = await accountsRes.json();
    
    for (const acc of accounts) {
      try {
        console.log(`Sincronizando conta: ${acc.email}`);
        const token = await fetchToken(acc.email, acc.password);
        const messages = await fetchMessages(token);
        
        const toProcess = messages.slice(0, 10);
        const fullMessages = [];
        
        for (const msg of toProcess) {
          let bodyText = msg.intro || "";
          let bodyHtml = "";
          try {
            const detail = await fetchMessageDetail(token, msg.id);
            bodyText = detail.text || msg.intro || "";
            bodyHtml = detail.html || "";
          } catch (e) {
             // fallback to intro
          }
          
          fullMessages.push({
            id: msg.id,
            from: msg.from?.address || "Desconhecido",
            subject: msg.subject || "Sem Assunto",
            bodyText: bodyText,
            bodyHtml: bodyHtml,
            receivedAt: msg.createdAt
          });
        }
        
        if (fullMessages.length > 0) {
          // Envia as mensagens para a Vercel salvar no Postgres
          const syncRes = await fetch(`${VERCEL_URL}/api/admin/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: SYNC_SECRET,
              accountId: acc.id,
              messages: fullMessages
            })
          });
          
          if (!syncRes.ok) {
            console.error(`Erro ao salvar mensagens da Vercel para ${acc.email}`);
          } else {
            const result = await syncRes.json();
            if (result.saved > 0) {
              console.log(`  -> Salvo ${result.saved} novos emails no banco de dados!`);
            }
          }
        }
      } catch (err) {
        console.error(`Erro na conta ${acc.email}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("Erro geral no ciclo:", err.message);
  }
}

async function run() {
  console.log("🔥 LSHOP Receiver - Sincronizador Local Iniciado 🔥");
  console.log("Mantenha esta janela aberta para os emails chegarem em tempo real.");
  console.log("================================================================");
  
  while (true) {
    await syncAllAccounts();
    await delay(10000); // 10 segundos
  }
}

run();
