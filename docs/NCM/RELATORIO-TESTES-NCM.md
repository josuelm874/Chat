# Relatório de Testes – Consulta de Produto NCM

## Resumo executivo

| Métrica | Valor |
|---------|-------|
| Total de testes | 18 |
| Acerto total (cap. esperado no topo) | 16 |
| Parcial (cap. esperado presente) | 1 |
| Falha | 1 |
| **Taxa de acerto** | **88,9%** |

*Pós-correção (café torrado): 09012100 agora no topo.*

---

## Análise por caso de teste

| # | Query | Cap. esperado | Resultado (topo) | Status | Observação |
|---|-------|---------------|------------------|--------|------------|
| 1 | refrigerante | 22 | 22021000 (22) | OK | Fase P3 |
| 2 | arroz agulhinha | 10 | 10063021 (10) | OK | Agulhinha correto |
| 3 | leite UHT integral | 04 | 04012010 (04) | OK | UHT→leite funcionou |
| 4 | feijão carioca | 07 | 07133190 (07) | OK | Fase P4 |
| 5 | achocolatado | 18 | 18061000 (18) | OK | Fase P4 |
| 6 | carne bovina | 02 | 02013000 (02) | OK | Cap. correto |
| 7 | óleo de soja | 15 | 15071000 (15) | OK | Soja refinado |
| 8 | bolacha recheada | 19 | 19053100 (19) | OK | Wafer recheado |
| 9 | água mineral | 22 | 22011000 (22) | OK | 3º item cap. 85 (ruído) |
| 10 | açúcar cristal | 17 | 17011400 (17) | OK | Cristal |
| 11 | fralda descartável | 96 | 96190000 (96) | OK | Fase P4 |
| 12 | detergente líquido | 34 | 34013000 (34) | OK | Cap. 34 correto |
| 13 | mouse USB | 85 | 84716053 (84) | PARCIAL | 8471 = periféricos PC (84); aceitável |
| 14 | geleia de morango | 20 | 20079990 (20) | OK | Conserva |
| 15 | café torrado | 09 | 09012100 (09) | OK | Corrigido: NCM_ALIASES + KEYWORD_CHAPTER 09 |
| 16 | Ref. 2L cola | 22 | 22021000 (22) | OK | Pré-processo REF→refrigerante ok |
| 17 | macarrão espaguete | 19 | 19022000 (19) | OK | Massas |
| 18 | castanha de caju | 08 | 08013200 (08) | OK | Caju/castanha |

---

## Evidências dos logs

### Hipóteses avaliadas

- **H1 (tokens)**: CONFIRMADA – tokens extraídos corretamente; "leite UHT" → ["leite","leite","integral"]; "Ref. 2L cola" → ["refrigerante","cola"]
- **H2 (resultados)**: PARCIAL – 2 falhas: café torrado (cap. errado), mouse USB (84 vs 85)
- **H3 (fases)**: CONFIRMADA – multi-fase funciona; P1 suficiente em 9 casos, P2–P4 necessário em 9
- **H4 (capítulo)**: CONFIRMADA – chapterHint geralmente correto
- **H5 (threshold)**: CONFIRMADA – fallback P4 encontrou resultados em feijão, achocolatado, fralda, detergente, mouse

### Casos que exigem correção

1. **Café torrado** – chapterHint 09 correto, mas topo foi 21013000 (cap. 21, extrato). NCM 0901 deveria prevalecer.
2. **Mouse USB** – "usb" pode estar ausente em aliases; 84716053 (cap. 84) é tecnicamente válido (máquinas de processamento de dados).
