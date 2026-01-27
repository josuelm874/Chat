#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera embeddings para cada NCM de 8 dígitos a partir da descrição completa (4+6+8).
Saída: ncm-embeddings.json para uso com ncm-embeddings.js (Transformers.js).
Modelo: paraphrase-multilingual-MiniLM-L12-v2 (mesmo usável no browser).
"""

import json
import sys
from pathlib import Path

# Caminhos (ajustar se necessário)
ROOT = Path(__file__).resolve().parents[2]
TABLE_PATH = ROOT / "docs" / "NCM" / "Tabela_NCM.json"
OUT_PATH = ROOT / "docs" / "NCM" / "ncm-embeddings.json"


def flatten_ncm_table(data):
    """Réplica a lógica do ncm-motor: só 8 dígitos, desc4+desc6+desc8."""
    out = []
    if not data or not isinstance(data, dict):
        return out
    for level_key, root in data.items():
        if not root or not isinstance(root.get("capitulos"), dict):
            continue
        for cap_key, cap in root["capitulos"].items():
            ncms = cap.get("ncms") or {}
            for ncm_key, n in ncms.items():
                if not n or not n.get("codigo") or not n.get("descricao"):
                    continue
                c = "".join(ch for ch in str(n["codigo"]) if ch.isdigit())
                if len(c) != 8:
                    continue
                c4, c6 = c[:4], c[:6]
                d4 = (ncms.get(c4) or {}).get("descricao") or ""
                d6 = (ncms.get(c6) or {}).get("descricao") or ""
                parts = [d4, d6, n["descricao"]]
                full = " ".join(p for p in parts if p).replace("\n", " ").strip()
                full = " ".join(full.split())
                out.append({
                    "codigo": c,
                    "descricao": n["descricao"],
                    "descricao4": d4,
                    "descricao6": d6,
                    "descricaoCompleta": full or n["descricao"],
                    "capitulo": "".join(ch for ch in str(cap_key) if ch.isdigit())[:2],
                })
    return out


def main():
    print("Carregando Tabela_NCM.json...")
    with open(TABLE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = flatten_ncm_table(data)
    print(f"NCMs de 8 dígitos: {len(items)}")

    print("Carregando modelo sentence-transformers...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    texts = [x["descricaoCompleta"] for x in items]
    print("Gerando embeddings...")
    embs = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

    out = []
    for i, row in enumerate(items):
        out.append({
            "codigo": row["codigo"],
            "descricao": row["descricao"],
            "descricao4": row["descricao4"],
            "descricao6": row["descricao6"],
            "capitulo": row["capitulo"],
            "embedding": [round(float(x), 6) for x in embs[i].tolist()],
        })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Salvo em {OUT_PATH}")


if __name__ == "__main__":
    main()
