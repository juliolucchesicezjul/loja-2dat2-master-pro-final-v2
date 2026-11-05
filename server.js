const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;
const ARQUIVO = "./dados.json";

app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

function carregar() {
    const texto = fs.readFileSync(ARQUIVO, "utf-8");
    return JSON.parse(texto);
}
function salvar(dados) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2));
}
let { categorias, produtos } = carregar();
let proximoid = produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
function comCategoria(p) {
    const cat = categorias.find(c => c.id == p.categoriaid);
    return { ...p, categoria: cat ? cat.nome : "sem categoria" };
}
app.get("/categorias", (req, res) => {
    res.status(200).json(categorias);
});

app.get("/produtos", (req, res) => {
    let lista = produtos.map(comCategoria);
    if (req.query.categoria) {
        const catid = Number(req.query.categoria);
        lista = lista.filter(p => p.categoriaid == catid);
    }

    const ordenar = req.query.ordenar;
    if (ordenar === "preco") lista.sort((a, b) => a.preco - b.preco);
    if (ordenar === "estoque") lista.sort((a, b) => a.estoque - b.estoque);
    if (ordenar === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome));

    res.status(200).json(lista);
});

app.get("/produtos/:id", (req, res) => {
    const id = Number(req.params.id);
    const produto = produtos.find(p => p.id === id);
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
    res.status(200).json(comCategoria(produto));
});

function validar(body) {
    const nome = body.nome || "".trim();
    const preco = Number(body.preco);
    const estoque = Number(body.estoque);
    const categoriaid = Number(body.categoriaid);

    if (!nome) return { erro: "Nome é obrigatório" };
    if (Number.isNaN(preco) || preco <= 0) return { erro: "Preço é obrigatório e deve ser um número positivo" };
    if (Number.isNaN(estoque) || estoque < 0) return { erro: "Estoque é obrigatório e deve ser um número inteiro" };
    if (!categorias.find((c) => c.id === categoriaid)) return { erro: "Categoria inexistente" };

    return { ok: { nome, preco, estoque, categoriaid } };
}

app.post("/produtos", (req, res) => {
    const v = validar(req.body);
    if (v.erro) return res.status(400).json({ erro: v.erro });

    const novo = { id: proximoid++, ...v.ok };
    produtos.push(novo);
    salvar({ categorias, produtos });
    res.status(201).json(comCategoria(novo));
});

app.put("/produtos/:id", (req, res) => {
    const id = Number(req.params.id);
    const produto = produtos.find(p => p.id === id);
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

    const v = validar(req.body);
    if (v.erro) return res.status(400).json({ erro: v.erro });

    produto.nome = v.ok.nome;
    produto.preco = v.ok.preco;
    produto.estoque = v.ok.estoque;
    produto.categoriaid = v.ok.categoriaid;
    salvar({ categorias, produtos });
    res.status(200).json(comCategoria(produto));
});

app.delete("/produtos/:id", (req, res) => {
    const id = Number(req.params.id);
    const indice = produtos.findIndex(p => p.id === id);
    if (indice === -1) return res.status(404).json({ erro: "Produto não encontrado" });

    produtos.splice(indice, 1);
    salvar({ categorias, produtos });
    res.status(204).end();
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 