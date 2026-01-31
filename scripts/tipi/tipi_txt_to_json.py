#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversor TIPI: arquivo TXT (tab-separado) -> JSON (estrutura tipo Tabela_NCM)

Formato do TIPI.txt (colunas separadas por TAB):
  - Coluna 1: NCM (8 dígitos)
  - Coluna 2: Redução de Alíquota (com %)
  - Coluna 3: CST (3 dígitos)
  - Coluna 4: Classificação Tributária (6 dígitos)

Gera Tabela_TIPI.json e Tabela_TIPI.js (window.TIPI_TABELA_DATA).

Uso: python tipi_txt_to_json.py [TIPI.txt] [saida.json]
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

from _ncm_levels import LEVELS_STRUCTURE, find_level_for_chapter

_PROJECT = Path(__file__).resolve().parents[2]
DEFAULT_TXT = _PROJECT / "docs" / "NCM" / "TIPI.txt"
DEFAULT_JSON = _PROJECT / "docs" / "NCM" / "Tabela_TIPI.json"


def _normalize_ncm(raw):
    s = str(raw or "").strip()
    digits = "".join(c for c in s if c.isdigit())
    return digits if len(digits) >= 2 else ""


def _normalize_reducao(raw):
    if raw is None or raw == "":
        return 0.0
    s = str(raw).strip().replace(",", ".")
    s = re.sub(r"%\s*$", "", s, flags=re.I)
    try:
        return float(s)
    except ValueError:
        return 0.0


def _normalize_cst(raw):
    s = str(raw or "").strip()
    digits = "".join(c for c in s if c.isdigit())
    return digits.zfill(3)[-3:]


def _normalize_classificacao(raw):
    s = str(raw or "").strip()
    digits = "".join(c for c in s if c.isdigit())
    return digits.zfill(6)[-6:]


def tipi_txt_to_json(input_path, output_path=None):
    input_path = Path(input_path)
    if not input_path.exists():
        print("Erro: Arquivo nao encontrado:", input_path)
        return False

    print("TXT:", input_path)

    structure = {}
    for level_name, level_data in LEVELS_STRUCTURE.items():
        structure[level_name] = {"descricao": level_data["descricao"], "capitulos": {}}
        for ch, ch_desc in level_data["capitulos"].items():
            structure[level_name]["capitulos"][ch] = {"descricao": ch_desc, "ncms": {}}

    ok = skip = 0
    preview = []

    for line in open(input_path, "r", encoding="utf-8"):
        parts = line.strip().split("\t")
        if len(parts) < 4:
            skip += 1
            continue
        a, b, c, d = parts[0], parts[1], parts[2], parts[3]
        codigo = _normalize_ncm(a)
        if not codigo or len(codigo) < 8:
            skip += 1
            continue
        if len(codigo) > 8:
            codigo = codigo[:8]

        reducao = _normalize_reducao(b)
        cst = _normalize_cst(c)
        classificacao = _normalize_classificacao(d)
        chapter = codigo[:2]
        if codigo.startswith("999"):
            chapter = "999"

        level_name = find_level_for_chapter(chapter)
        if not level_name:
            skip += 1
            continue
        cap = structure[level_name]["capitulos"].get(chapter)
        if not cap:
            skip += 1
            continue

        cap["ncms"][codigo] = {
            "codigo": codigo,
            "reducao_aliquota": round(reducao, 2),
            "cst": cst,
            "classificacao_tributaria": classificacao,
        }
        ok += 1
        if len(preview) < 5:
            preview.append((codigo, round(reducao, 2), cst, classificacao))

    if preview:
        print("Preview (primeiras linhas):")
        for cod, red, cst, cls in preview:
            print("  ", cod, "| reducao:", red, "% | cst:", cst, "| class:", cls)

    out = Path(output_path) if output_path else DEFAULT_JSON
    out.parent.mkdir(parents=True, exist_ok=True)
    print("JSON:", out)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(structure, f, ensure_ascii=False, indent=2)

    js_out = out.with_suffix(".js")
    js_content = "// TIPI – gerado por tipi_txt_to_json.py\n"
    js_content += "// " + datetime.now().isoformat() + "\n\n"
    js_content += "window.TIPI_TABELA_DATA = " + json.dumps(structure, ensure_ascii=False, indent=2) + ";\n"
    with open(js_out, "w", encoding="utf-8") as f:
        f.write(js_content)
    print("JS:  ", js_out)
    print("Processadas:", ok, "| Ignoradas:", skip)
    return True


def main():
    txt = sys.argv[1] if len(sys.argv) >= 2 else DEFAULT_TXT
    out = sys.argv[2] if len(sys.argv) >= 3 else None
    if not tipi_txt_to_json(txt, out):
        sys.exit(1)
    print("TIPI TXT -> JSON concluido.")


if __name__ == "__main__":
    main()
