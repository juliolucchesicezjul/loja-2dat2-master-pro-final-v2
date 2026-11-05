let api = "http://localhost:3000";

try { api = localStorage.getItem("apiurl") || api; } catch (e) {}
const $ = (id) => document.getElementById(id);
$("apiurl").value = api;

function setstatus(ok, msg) {
    const s = $("status");
    s.className= "status " + (ok ? "ok" : "off");
    s.textContent = msg;
}

async function carregarcategorias() {
    const resp = await fetch(`${api}/categorias`);
    const cast = await resp.json();

    const selform = $("categoriaid");
    const selfiltro = $("filtrocategoria");

    selform.innerHTML = "";
    selfiltro.innerHTML = '<option value=""> Todas as categorias</option>';

    cast.forEach((c) => {
        selform.insertAdjacentHTML("beforeend",
             `<option value="${c.id}">${c.nome}</option>`);
        selfiltro.insertAdjacentHTML("beforeend",
             `<option value="${c.id}">${c.nome}</option>`);

    });
}

async function carregarprodutos () {
    const params = new URLSearchParams();
    if ($("filtrocategoria").value) params.set("categoriaid", $("filtrocategoria").value);
    if ($("ordenar").value) params.set("ordenar", $("ordenar").value);

    const resp = await fetch(`${api}/produtos?${params.toString()}`);
    const produtos = await resp.json();
    const ul = $("lista");
    ul.innerHTML = "";
    $("vazio").textContent = produtos.length ? "" : "Nenhum produto encontrado.";
    produtos.forEach((p) => {
        const li = document.createElement("li");
        li.className = "item";
        li.innerHTML = `
        <div>
        <div class="nome">${p.nome}</div>
        <div class="meta">${p.categoria} · estoque: ${p.estoque}</div>
        </div>
        <div style="display:flex;align-items:center;gap:14px">
        <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
        <div class="botoes">
        <button data-ed="${p.id}">Editar</button>
        <button class="del" data-del="${p.id}">Excluir</button>
        </div>
    </div>`;
        ul.appendChild(li);
    });
}

async function conectar() {
    api = $("apiurl").value.trim().replace(/\/+$/, "");
    try { localStorage.setItem("apiurl", api); } catch (e) {}
    try {
        await carregarcategorias();
        await carregarprodutos();
        setstatus(true, " ¶ Conectado");
    }catch (e) {
        setstatus(false, " ¶ sem conecao com a api ");
    }
}

function entraredicao(p) {

    $("editid").value = p.id;
    $("nome").value = p.nome;
    $("preco").value = p.preco;
    $("estoque").value = p.estoque;
    $("categoriaid").value = p.categoriaid;
    $("formtitulo").textContent = "Editar produto";
    $("salvarproduto").textContent = "Salvar";
    $("cancelar").hidden = false;
}

//volta o formulário para o estado de cadastro de um novo produto.
function limparform() {
    $("editid").value = "";
    $("nome").value = $("preco").value = $("estoque").value = "";
    $("formtitulo").textContent = "novo produto";
    $("salvarproduto").textContent = "adicionar";
    $("cancelar").hidden = true;
    $("formerro").textContent = "";
}

async function salvarproduto() {
    const corpo = {
        nome: $("nome").value,
        preco: $("preco").value,
        estoque: $("estoque").value,
        categoriaid: $("categoriaid").value
    };
    const id = $("editid").value;
    const url = id ? `${api}/produtos/${id}` : `${api}/produtos`;
    const metodo = id ? "PUT" : "POST";
    const resp = await fetch(url, {
        method: metodo,
        //informa ao servidor que o corpo da requisição esta em JSON
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    });
    const dados = await resp.json();
    if (!resp.ok) { { $("formerro").textContent = dados.erro || "Erro desconhecido"; return; }
limparform();
     carregarprodutos();
}}


document.addEventListener("click", async (e) => {
    if (e.target.dataset.del) {
        await fetch(`${api}/produtos/${e.target.dataset.del}`, { method: "DELETE" });
        carregarprodutos();
    }
    if (e.target.dataset.ed) {
        const resp = await fetch(`${api}/produtos/${e.target.dataset.ed}`);
        entraredicao(await resp.json());
    }
}); 
$("salvarurl").addEventListener("click", conectar);
$("salvarproduto").addEventListener("click", salvarproduto);
$("cancelar").addEventListener("click", limparform);
$("recarregar").addEventListener("click", carregarprodutos);
$("filtrocategoria").addEventListener("change", carregarprodutos);
$("ordenar").addEventListener("change", carregarprodutos);

conectar();
