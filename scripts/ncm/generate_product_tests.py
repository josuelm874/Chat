#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera dataset de testes com 10.000+ produtos para Consulta NCM.
Produtos diversos, alguns com nomenclatura similar/variada, maioria diferentes.
Capítulos NCM esperados para avaliação de acurácia.
"""

import json
import random
from pathlib import Path

_PROJECT = Path(__file__).resolve().parents[2]
OUTPUT = _PROJECT / "docs" / "NCM" / "produtos-teste.json"

# Categorias: (termos_base, cap_esperado, variacoes_nomenclatura)
CATEGORIAS = [
    # Bebidas (22)
    (["refrigerante", "refresco", "ref", "soda", "bebida gaseificada"], "22", ["cola", "guarana", "laranja", "limão", "2L", "350ml", "1.5L", "lata", "pet"]),
    (["água mineral", "água", "agua", "mineral", "água potável"], "22", ["500ml", "1.5L", "20L", "gallon", "com gás", "sem gás"]),
    (["suco", "sumo", "néctar", "polpa"], "20", ["laranja", "uva", "manga", "maracujá", "1L", "200ml", "concentrado"]),
    (["cerveja", "chopp", "lager", "pilsen"], "22", ["350ml", "600ml", "lata", "long neck", "garrafa"]),
    (["vinho", "vinho tinto", "vinho branco", "espumante"], "22", ["750ml", "garrafa", "seco", "suave"]),
    (["achocolatado", "achoc", "toddy", "nescau", "chocolate em pó"], "18", ["400g", "1kg", "pct", "lata"]),
    (["café", "café torrado", "café solúvel", "café em pó"], "09", ["250g", "500g", "pilão", "descafeinado"]),
    (["chá", "cha", "chá verde", "mate"], "09", ["sachê", "caixa", "erva", "500g"]),
    # Alimentos (02-21)
    (["carne bovina", "carne", "bovino", "picanha", "costela", "alcatra"], "02", ["kg", "bife", "moída", "congelada"]),
    (["carne suína", "carne de porco", "porco", "suíno", "lombo"], "02", ["kg", "bacon", "presunto cru"]),
    (["frango", "ave", "frango inteiro", "coxa", "peito"], "02", ["kg", "congelado", "resfriado"]),
    (["leite", "leite UHT", "leite integral", "leite desnatado"], "04", ["1L", "1litro", "longa vida", "caixa"]),
    (["queijo", "queijo minas", "muçarela", "parmesão", "cheddar"], "04", ["fatia", "rallado", "kg", "200g"]),
    (["manteiga", "creme de leite", "iogurte", "requeijão"], "04", ["200g", "500g", "natural", "light"]),
    (["arroz", "arroz agulhinha", "arroz integral", "arroz parboilizado"], "10", ["5kg", "1kg", "tipo 1", "branco"]),
    (["feijão", "feijão carioca", "feijão preto", "feijão verde"], "07", ["1kg", "pacote", "enlatado"]),
    (["macarrão", "macarrão espaguete", "espaguete", "espag", "penne", "parafuso"], "19", ["500g", "1kg", "massa", "sêmola"]),
    (["açúcar", "açúcar cristal", "açúcar refinado", "acucar"], "17", ["1kg", "5kg", "mascavo"]),
    (["óleo", "óleo de soja", "óleo de milho", "oleo vegetal"], "15", ["900ml", "1L", "litro", "refinado"]),
    (["farinha", "farinha de trigo", "farinha de mandioca"], "11", ["1kg", "pão", "rosca"]),
    (["bolacha", "biscoito", "biscoito recheado", "cookie", "wafer"], "19", ["140g", "pacote", "cream cracker"]),
    (["pão", "pão de forma", "pão francês", "pão integral"], "19", ["400g", "fatia", "unidade"]),
    (["geleia", "gelea", "compota", "doce de fruta"], "20", ["morango", "uva", "pêssego", "250g"]),
    (["molho de tomate", "ketchup", "mostarda", "maionese"], "21", ["340g", "500g", "sache"]),
    (["conserva", "milho em conserva", "ervilha", "palmito"], "20", ["lata", "vidro", "200g"]),
    (["sal", "sal refinado", "sal grosso"], "25", ["1kg", "pacote", "iodado"]),
    (["castanha", "castanha de caju", "amendoim", "amêndoa", "nozes"], "08", ["200g", "pacote", "salmoura"]),
    (["chocolate", "bombom", "barra de chocolate", "chocolate ao leite"], "18", ["90g", "250g", "tablete"]),
    (["sorvete", "gelado", "picolé", "açai"], "21", ["2L", "pote", "palito", "copo"]),
    # Higiene e limpeza (33, 34, 96)
    (["sabonete", "sabão", "sabonete líquido"], "34", ["90g", "líquido", "barras"]),
    (["shampoo", "condicionador", "creme de pentear"], "33", ["400ml", "lata", "anticaspa"]),
    (["creme dental", "pasta de dente", "dentifrício"], "33", ["90g", "120g", "fluoretada"]),
    (["desodorante", "antitranspirante", "spray"], "33", ["150ml", "aerossol", "roll-on"]),
    (["fralda", "fralda descartável", "fralda infantil"], "96", ["pct", "recém-nascido", "tamanho M"]),
    (["detergente", "detergente líquido", "líquido de lavar louça"], "34", ["500ml", "1L", "limão"]),
    (["álcool", "álcool 70", "álcool em gel"], "22", ["500ml", "1L", "gel", "líquido"]),
    (["papel higiênico", "papel toalha", "lenço de papel"], "48", ["rolo", "4 rolos", "folha dupla"]),
    # Eletrônicos (84, 85)
    (["mouse", "mouse USB", "mouse sem fio", "mouse gamer"], "84", ["usb", "wireless", "óptico"]),
    (["teclado", "teclado USB", "teclado mecânico"], "84", ["usb", "sem fio", "abnt2"]),
    (["pilha", "bateria", "pilha alcalina"], "85", ["AA", "AAA", "9V", "4 unidades"]),
    (["fio", "cabo", "cabo USB", "carregador"], "85", ["usb", "2m", "elétrico"]),
    (["lâmpada", "lampada", "lâmpada led"], "85", ["7w", "9w", "e27", "bulbo"]),
    (["celular", "smartphone", "aparelho celular"], "85", ["case", "película", "carregador"]),
    # Vestuário (61, 62)
    (["camiseta", "camisa", "blusa", "regata"], "61", ["malha", "algodão", "p", "m", "g"]),
    (["calça", "calça jeans", "bermuda"], "62", ["jeans", "sarja", "tamanho 38"]),
    (["meia", "meia masculina", "meia feminina"], "61", ["par", "algodão", "cano longo"]),
    # Plásticos e papel (39, 48)
    (["saco plástico", "sacola", "embalagem plástica"], "39", ["100un", "resíduos", "30x40"]),
    (["filme plástico", "papel filme", "plástico filme"], "39", ["30m", "15m", "pvc"]),
    (["caderno", "caderno espiral", "agenda"], "48", ["96 folhas", "10 matérias", "capa dura"]),
    (["caneta", "caneta esferográfica", "lapiseira"], "96", ["azul", "preta", "caixa 12"]),
    # Químicos (28, 32)
    (["tinta", "tinta látex", "tinta acrílica"], "32", ["18L", "3.6L", "branca", "fosca"]),
    (["verniz", "verniz marítimo", "selador"], "32", ["1L", "transparente", "brilho"]),
    (["acetona", "removedor", "diluente"], "28", ["500ml", "1L", "esmalte"]),
    # Veículos (87)
    (["pneu", "pneu automotivo", "pneu de carro"], "40", ["175/70", "aro 14", "radial"]),
    (["óleo lubrificante", "óleo de motor", "óleo 20w50"], "27", ["1L", "4L", "mineral"]),
    (["bateria automotiva", "bateria de carro"], "85", ["60Ah", "12V", "selada"]),
    # Diversos
    (["corda", "barbante", "fio nylon"], "56", ["100m", "kg", "plástico"]),
    (["vela", "vela de parafina", "vela aromática"], "34", ["aromatizada", "decorativa", "branca"]),
    (["alicate", "chave de fenda", "chave inglesa"], "82", ["10 polegadas", "phillips", "combinada"]),
    (["parafuso", "parafuso sextavado", "parafuso auto atarraxante"], "73", ["inox", "ferro", "6x50"]),
    (["martelo", "marreta", "machado"], "82", ["500g", "cabo fibra", "unha"]),
    (["trena", "fita métrica", "metro"], "90", ["5m", "8m", "retrátil"]),
    # Mais categorias
    (["bombom", "trufa", "confeito", "balas"], "17", ["200g", "caixa", "sortidos"]),
    (["mel", "mel de abelha", "geleia real"], "04", ["500g", "pote", "natural"]),
    (["azeite", "azeite de oliva", "oliva"], "15", ["500ml", "extra virgem", "litro"]),
    (["massa de tomate", "extrato de tomate", "polpa de tomate"], "20", ["340g", "1kg", "lata"]),
    (["tempero", "tempero pronto", "caldo", "sazon"], "21", ["50g", "cubos", "sabor"]),
    (["salame", "mortadela", "presunto", "apresuntado"], "16", ["fatiado", "100g", "kg"]),
    (["iogurte", "iogurte natural", "petit suisse"], "04", ["170g", "500g", "desnatado"]),
    (["bebida láctea", "leite fermentado", "yakult"], "04", ["80ml", "6 un", "light"]),
    (["biscoito", "cracker", "cream cracker", "água e sal"], "19", ["140g", "200g", "pct"]),
    (["pão de queijo", "bolinho", "coxinha", "empada"], "19", ["un", "400g", "congelado"]),
    (["pipoca", "milho pipoca", "pipoca para micro-ondas"], "19", ["pacote", "sachê", "natural"]),
    (["cereal matinal", "aveia", "granola"], "19", ["400g", "cereal", "flakes"]),
    (["nutella", "creme de avelã", "creme chocolate"], "18", ["350g", "pote", "kg"]),
    (["azeitona", "oliva", "azeitona verde"], "20", ["conserva", "200g", "vidro"]),
    (["pimenta", "pimenta do reino", "canela", "noz moscada"], "09", ["moída", "50g", "pote"]),
    (["vinagre", "vinagre de álcool", "vinagre de maçã"], "22", ["750ml", "1L", "branco"]),
    (["desinfetante", "desinfetante multiuso", "pinho"], "38", ["1L", "500ml", "floral"]),
    (["sabão em pó", "detergente em pó", "lava roupas"], "34", ["1kg", "5kg", "concentrado"]),
    (["amaciante", "amaciante de roupas", "suavizante"], "34", ["500ml", "1L", "concentrado"]),
    (["álcool 70", "álcool 46", "álcool líquido"], "22", ["500ml", "1L", "limpeza"]),
    (["esponja", "esponja de aço", "palha de aço"], "73", ["multiuso", "un", "limpeza"]),
    (["luva", "luva de borracha", "luva descartável"], "40", ["un", "pct 100", "nitrílica"]),
    (["lâmpada led", "lâmpada fluorescente", "bulbo"], "85", ["9w", "15w", "e27"]),
    (["extensão", "benjamin", "tabela", "regua"], "85", ["5 tomadas", "3m", "metros"]),
    (["interruptor", "tomada", "plugue"], "85", ["un", "duplo", "embutir"]),
    (["tapete", "carpete", "cortina"], "57", ["2x3m", "metros", "lavável"]),
    (["tolha", "toalha de banho", "toalha de rosto"], "63", ["banho", "rosto", "jogo"]),
    (["colchão", "travesseiro", "almofada"], "94", ["casal", "solteiro", "espuma"]),
]

MARCAS = ["Genérico", "Marca X", "Super", "Premium", "Econômico", "Nacional", "Importado", "Linha"]
UNIDADES = ["", " 1un", " 2un", " 450g", " 1kg", " 500ml", " 1L", " cx 12", " pct 6"]


def gerar_produto(base: str, variacoes: list, cap: str) -> dict:
    """Gera um produto com variação aleatória."""
    parts = [base]
    if random.random() < 0.4:
        parts.append(random.choice(MARCAS))
    if random.random() < 0.5 and variacoes:
        parts.append(random.choice(variacoes))
    if random.random() < 0.3:
        parts.append(random.choice(UNIDADES))
    q = " ".join(str(p) for p in parts).strip()
    return {"q": q, "capEsperado": cap, "categoria": base[:30]}


def main():
    random.seed(42)
    produtos = []
    used = set()

    # Garantir diversidade: cada combinação base+variação várias vezes
    for termos, cap, variacoes in CATEGORIAS:
        for _ in range(random.randint(80, 200)):
            base = random.choice(termos)
            q = gerar_produto(base, variacoes, cap)
            key = (q["q"][:50], cap)
            if key not in used:
                used.add(key)
                produtos.append(q)

    # Adicionar variações de nomenclatura (produtos similares, nomes diferentes)
    sinonimos = [
        (["refrigerante", "ref", "refresco", "bebida gaseificada"], "22"),
        (["arroz", "cereal arroz", "grão arroz", "oryza"], "10"),
        (["leite", "lácteo", "leite uht", "leite longa vida"], "04"),
        (["feijão", "leguminosa", "phaseolus", "feijao carioca"], "07"),
        (["açúcar", "acucar", "sacarose", "açúcar cristal"], "17"),
        (["óleo", "oleo", "gordura vegetal", "óleo comestível"], "15"),
        (["macarrão", "macarrao", "massa", "espaguete", "espag"], "19"),
        (["café", "cafe", "café torrado", "café em grão"], "09"),
        (["carne", "proteína bovina", "carne vermelha", "bovino"], "02"),
        (["detergente", "líquido lavagem", "surfactante", "tensioativo"], "34"),
        (["fralda", "fralda descartavel", "higiene infantil", "papel higiênico infantil"], "96"),
        (["mouse", "apontador", "periférico", "dispositivo entrada"], "84"),
        (["pilha", "bateria", "célula", "pilha alcalina"], "85"),
    ]
    for termos, cap in sinonimos:
        for _ in range(random.randint(50, 120)):
            base = random.choice(termos)
            v = random.choice(UNIDADES) if random.random() < 0.4 else ""
            q = base + v
            key = (q[:50], cap)
            if key not in used:
                used.add(key)
                produtos.append({"q": q.strip(), "capEsperado": cap, "categoria": "sinônimo"})

    # Completar até 10.000+ com mais combinações
    while len(produtos) < 10000:
        termos, cap, variacoes = random.choice(CATEGORIAS)
        p = gerar_produto(random.choice(termos), variacoes, cap)
        key = (p["q"][:50], cap)
        if key not in used:
            used.add(key)
            produtos.append(p)

    random.shuffle(produtos)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    data = {"produtos": produtos, "total": len(produtos)}
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=0)

    js_out = OUTPUT.with_suffix(".js")
    with open(js_out, "w", encoding="utf-8") as f:
        f.write("window.PRODUTOS_TESTE=" + json.dumps(data, ensure_ascii=False) + ";")
    print(f"Gerados {len(produtos)} produtos em {OUTPUT} e {js_out}")


if __name__ == "__main__":
    main()
