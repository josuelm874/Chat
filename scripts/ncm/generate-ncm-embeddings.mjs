/**
 * Gera ncm-embeddings.json usando @xenova/transformers (mesmo modelo do browser).
 * Uso: npm install && npm run generate-embeddings
 */

import { pipeline } from '@xenova/transformers';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TABLE_PATH = join(ROOT, 'docs', 'NCM', 'Tabela_NCM.json');
const OUT_PATH = join(ROOT, 'docs', 'NCM', 'ncm-embeddings.json');

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

function flattenNcmTable(data) {
  const out = [];
  if (!data || typeof data !== 'object') return out;
  for (const levelKey of Object.keys(data)) {
    const root = data[levelKey];
    if (!root?.capitulos) continue;
    for (const capKey of Object.keys(root.capitulos)) {
      const cap = root.capitulos[capKey];
      const ncms = cap?.ncms || {};
      for (const ncmKey of Object.keys(ncms)) {
        const n = ncms[ncmKey];
        if (!n?.codigo || !n?.descricao) continue;
        const c = String(n.codigo).replace(/\D/g, '');
        if (c.length !== 8) continue;
        const c4 = c.slice(0, 4);
        const c6 = c.slice(0, 6);
        const d4 = (ncms[c4]?.descricao || '').trim();
        const d6 = (ncms[c6]?.descricao || '').trim();
        const full = [d4, d6, n.descricao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        out.push({
          codigo: c,
          descricao: n.descricao,
          descricao4: d4,
          descricao6: d6,
          descricaoCompleta: full || n.descricao,
          capitulo: String(capKey).replace(/\D/g, '').slice(0, 2),
        });
      }
    }
  }
  return out;
}

async function main() {
  console.log('Carregando Tabela_NCM.json...');
  const data = JSON.parse(readFileSync(TABLE_PATH, 'utf8'));
  const items = flattenNcmTable(data);
  console.log('NCMs 8 dígitos:', items.length);

  console.log('Carregando modelo', MODEL_ID, '...');
  const extractor = await pipeline('feature-extraction', MODEL_ID, {
    pooling: 'mean',
    normalize: true,
  });

  const BATCH = 64;
  const out = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const texts = batch.map((x) => x.descricaoCompleta);
    const t = await extractor(texts, { pooling: 'mean', normalize: true });
    const dim = t.dims[t.dims.length - 1];
    const arr = Array.from(t.data);
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const emb = arr.slice(j * dim, (j + 1) * dim).map((x) => Math.round(Number(x) * 1e6) / 1e6);
      out.push({
        codigo: row.codigo,
        descricao: row.descricao,
        descricao4: row.descricao4,
        descricao6: row.descricao6,
        capitulo: row.capitulo,
        embedding: emb,
      });
    }
    if ((i + BATCH) % 500 === 0 || i + BATCH >= items.length) {
      console.log('Embeddings:', Math.min(i + BATCH, items.length), '/', items.length);
    }
  }

  mkdirSync(join(ROOT, 'docs', 'NCM'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out), 'utf8');
  console.log('Salvo em', OUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
