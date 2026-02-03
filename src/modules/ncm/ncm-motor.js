/**
 * Motor de Correlação Produto → NCM (estilo SEFAZ)
 * Normalização, busca na tabela, regras por capítulo, ranqueamento.
 * Depende de window.NCM_TABELA_DATA (Tabela_NCM.js).
 *
 * Estrutura e tomada de decisão (assimilação produto ↔ NCM):
 * - docs/NCM-ESTRUTURA-DECISAO.md: fluxo completo, filtros, score, ordenação, fallback, correlação.
 * - docs/NCM-RGI.md: Regras Gerais Interpretativas (3a, 3c, 4) aplicadas.
 * - docs/NCM-BUSCA.md: sinônimos, aliases, extensibilidade.
 */

(function () {
  'use strict';

  var INDEX = [];
  var INDEX_BUILT = false;

  var STOPWORDS = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'um', 'uma', 'uns', 'umas',
    'o', 'a', 'os', 'as', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para',
    'com', 'sem', 'ao', 'aos', 'aquelas', 'aqueles', 'essa', 'esse', 'esta', 'este'
  ]);

  /** Tokens de ruído em descrições de produto (promo, marca, modelo, etc.). Removidos na normalização. */
  var NOISE_TOKENS = new Set([
    'prom', 'bat', 'predilecta', 'farmax', 'betakids', 'mod', 'concurso', 'cultural',
    'marca', 'generico', 'premium', 'economico', 'nacional', 'importado', 'linha', 'super'
  ]);

  /** Tokens genéricos em descrições NCM: reduzir peso do match para evitar falsos positivos */
  var NCM_GENERIC = new Set([
    'outros', 'outras', 'outrem', 'demais', 'diversos', 'diversas', 'resto', 'restante',
    'nenhuma', 'nenhum', 'parte', 'exceto', 'outro', 'outra'
  ]);

  /** Descrições muito genéricas (normalizadas): rejeitar como única base de match. */
  var DESC_GENERICA = new Set([
    'outros', 'outras', 'demais', 'diversos', 'resto', 'restante', 'parte', 'exceto'
  ]);

  /** NCM (8 dígitos) → termos extras para busca. Usado quando a descrição oficial não contém a palavra (ex.: refrigerante → 2202). */
  var NCM_ALIASES = {
    '22011000': 'agua mineral bebida liquido',
    '22021000': 'refrigerante refresco bebida gaseificada aromatizada coca cola guarana sodas',
    '22029900': 'refrigerante refresco bebida não alcoólica coca cola guarana sodas',
    '18061000': 'achocolatado cacau preparado bebida liquido chocolate toddynho nescau',
    '18069000': 'achocolatado cacau preparado bebida liquido chocolate toddynho nescau',
    '17011400': 'acucar açúcar cristal cana sacarose',
    '17019900': 'acucar açúcar cristal cana sacarose refinado mascavo',
    '07133319': 'feijao feijão preto Phaseolus leguminosa',
    '07133190': 'feijao feijão leguminosa carioca branco',
    '10063021': 'arroz agulhinha cereal branco polido',
    '10063029': 'arroz cereal branco polido',
    '02032900': 'carne suina porco congelada fresca',
    '02013000': 'carne bovina vitela desossa',
    '02071210': 'frango aves gallus peito congelado',
    '02071411': 'frango aves peito gallus congelado desossado',
    '04012010': 'leite UHT integral longa vida',
    '04014010': 'leite UHT desnatado longa vida',
    '04051000': 'manteiga liquida laticinios',
    '04052000': 'manteiga com sal sem sal laticinios',
    '19053100': 'bolacha biscoito wafer recheado',
    '21069090': 'tempero condimento preparado molho',
    '85365010': 'interruptor comutador eletrico circuito',
    '85366990': 'plugue tomada adaptador conectores eletrico',
    '85061019': 'pilha bateria celula eletrica',
    '84716052': 'teclado computador entrada',
    '84716053': 'mouse computador entrada apontador',
    '32100010': 'tinta corretivo massa caneta escrever',
    '34013000': 'detergente sabonete liquido tensioativo lavagem louca',
    '33049900': 'cosmetico perfume maquiagem higiene',
    '96190000': 'fralda higiene descartavel infantil',
    '20079990': 'geleia doce fruta conserva',
    '20089900': 'castanha amendoim amendoa nozes amêndoa',
    '08012100': 'castanha do pará brasil bertholletia',
    '08012200': 'castanha do pará brasil bertholletia pelada',
    '10041000': 'aveia cereal flocos grão',
    '10049000': 'aveia cereal flocos grão',
    '04052000': 'manteiga com sal laticinios gordura',
    '04051000': 'manteiga laticinios gordura',
    '25010020': 'sal refinado mesa cloreto sodio',
    '25010090': 'sal refinado cloreto sodio',
    '34023990': 'detergente liquido lavagem tensoativo',
    '07011000': 'batata semente',
    '07019000': 'batata inglesa fresca refrigerada',
    '07143000': 'inhame dioscorea tuberculo',
    '07093000': 'berinjela horticola',
    '07099300': 'abobrinha abóbora curgete cucurbita',
    '07096000': 'pimentao pimento capsicum',
    '07070000': 'pepino cornichon',
    '09012100': 'cafe café torrado grao grão não descafeinado',
    '09012200': 'cafe café descafeinado torrado',
    '16024900': 'bacon presunto embutido carne suina',
    '16010000': 'salsicha embutido carne',
    '02013000': 'contrafile carne bovina',
    '02032900': 'maminha carne bovina',
    '18069000': 'bombom chocolate cacau nutella',
    '17049020': 'pirulito chiclete goma acucar',
    '20011000': 'picles pepino conserva vinagre',
    '04063000': 'cream cheese queijo ricota coalhada',
    '22086000': 'vodka gin alcool destilado',
    '10085000': 'quinoa cereal grao',
    '12075000': 'gergelim semente sesamo',
    '11081400': 'tapioca polvilho mandioca',
    '19053100': 'rosquinha donut croissant biscoito',
    '16010000': 'hamburger salsicha embutido',
    '21069090': 'sazon oregano alecrim tempero',
    '32091000': 'verniz tinta',
    '32141000': 'silicone vedacao',
    '84713000': 'pendrive memoria usb',
    '84717010': 'hd disco rigido armazenamento',
    '96032100': 'cotonete higiene',
    '85171200': 'webcam camera computador',
    '84716060': 'webcam camera',
    '64039100': 'sapato couro social',
    '64041900': 'chinelo sandalia borracha'
  };

  /**
   * Produto (termo de busca) → termos que costumam aparecer nas descrições NCM.
   * Usado no fallback quando 0 resultados: expande a busca só no capítulo sugerido.
   * Para adicionar: editar aqui ou usar ncmMotor.addQuerySynonym(...) (persiste em localStorage).
   */
  var QUERY_SYNONYMS = {
    'refrigerante': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes', 'agua'],
    'refresco': ['gaseificada', 'aromatizada', 'bebida', 'nao alcoolica'],
    'coca': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes'],
    'cola': ['gaseificada', 'aromatizada', 'bebida', 'edulcorantes'],
    'guarana': ['gaseificada', 'bebida', 'edulcorantes'],
    'sorvete': ['gelado', 'gelados', 'sorvetes', 'mantecados', 'ice'],
    'detergente': ['tensioativos', 'surfactantes', 'detergentes', 'lavagem'],
    'sabonete': ['saboes', 'sabonetes', 'higiene', 'banho'],
    'sabao': ['saboes', 'sabonetes', 'tensioativos', 'higiene'],
    'abacaxi': ['ananases', 'abacaxis', 'fruta', 'ananassa'],
    'calda': ['conserva', 'compota', 'edulcorada', 'xarope', 'agua edulcorada'],
    'caldas': ['conserva', 'compota', 'edulcorada', 'xarope', 'calda'],
    'acerola': ['fruta', 'polpa', 'suco', 'malpighia'],
    'achoc': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'achocolatado': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'toddy': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'nescau': ['chocolate', 'cacau', 'bebida', 'cacau preparado'],
    'acetona': ['cetona', 'quimico', 'acido'],
    'acetato': ['celulose', 'vinila', 'polimero', 'plastico'],
    'cabelo': ['cabelo', 'madeixa', 'peruca', 'obras'],
    'mechas': ['cabelo', 'madeixa', 'obras'],
    'acucar': ['acucar', 'cana', 'cristal', 'sacarose', 'acúcar'],
    'arroz': ['arroz', 'cereal', 'oryza', 'polido', 'agulhinha', 'integral'],
    'espaguete': ['espaguete', 'massas', 'macarrao', 'alimenticias'],
    'espag': ['espaguete', 'massas', 'macarrao', 'alimenticias'],
    'macarrao': ['massas', 'alimenticias', 'semolina', 'sêmola'],
    'macarrão': ['massas', 'alimenticias', 'semolina'],
    'feijao': ['feijao', 'leguminosa', 'phaseolus', 'vagem', 'feijão'],
    'fralda': ['fralda', 'fraldas', 'higiene', 'descartavel', 'papel'],
    'interruptor': ['interruptor', 'comutador', 'eletrico', 'circuito'],
    'adaptador': ['adaptador', 'conector', 'plugue', 'tomada', 'eletrico'],
    'bateria': ['bateria', 'pilha', 'celula', 'eletrica'],
    'pilha': ['pilha', 'bateria', 'celula', 'eletrica'],
    'mouse': ['mouse', 'computador', 'entrada', 'apontador', 'teclado'],
    'teclado': ['teclado', 'computador', 'entrada', 'teclados'],
    'corretivo': ['corretivo', 'tinta', 'massa', 'caneta', 'escrever'],
    'leite': ['leite', 'laticinios', 'lácteos', 'creme'],
    'manteiga': ['manteiga', 'laticinios', 'gordura', 'leite'],
    'suco': ['suco', 'sumo', 'fruta', 'bebida', 'polpa'],
    'laranja': ['laranja', 'citrico', 'suco', 'sumo'],
    'linguica': ['linguica', 'embutido', 'carne', 'calabresa'],
    'sal': ['sal', 'cloreto', 'sodio'],
    'ovos': ['ovos', 'ovo', 'galinha', 'ave'],
    'sardinha': ['sardinha', 'peixe', 'pescado', 'conserva', 'lata'],
    'batata': ['batata', 'tuberculo', 'horticola', 'inglesa'],
    'aveia': ['aveia', 'cereal', 'flocos', 'grão'],
    'carne': ['carne', 'miudezas'],
    'porco': ['carne', 'suino', 'suína'],
    'bovino': ['carne', 'bovino', 'vitela', 'bovina'],
    'frango': ['aves', 'frangos', 'galinha', 'gallus'],
    'aves': ['aves', 'frangos', 'galinha', 'gallus'],
    'oleo': ['oleo', 'gordura', 'vegetal', 'comestível'],
    'óleo': ['oleo', 'gordura', 'vegetal'],
    'bolacha': ['bolacha', 'biscoito', 'farinha', 'massas', 'alimenticias'],
    'biscoito': ['bolacha', 'biscoito', 'farinha', 'massas'],
    'geleia': ['geleia', 'fruta', 'açúcar', 'conserva', 'compota'],
    'agua': ['agua', 'mineral', 'potavel', 'bebida'],
    'água': ['agua', 'mineral', 'potavel', 'bebida'],
    'castanha': ['castanha', 'nozes', 'frutos', 'caju', 'amendoim'],
    'amendoim': ['amendoim', 'cacahuete', 'frutos', 'oleaginosos'],
    'cosmetico': ['cosmetico', 'perfume', 'maquiagem', 'higiene', 'beleza'],
    'shampoo': ['saboes', 'tensioativos', 'cabelo', 'higiene'],
    'cafe': ['cafe', 'café', 'torrado', 'grao', 'descafeinado'],
    'café': ['cafe', 'café', 'torrado', 'grao', 'descafeinado'],
    'peito': ['aves', 'frango', 'peito', 'frangos'],
    'costela': ['carne', 'bovino', 'costela', 'bovina'],
    'alcatra': ['carne', 'bovino', 'alcatra', 'bovina'],
    'coxa': ['aves', 'frango', 'coxa', 'frangos'],
    'lombo': ['carne', 'suino', 'porco'],
    'desodorante': ['cosmetico', 'higiene', 'antitranspirante'],
    'spray': ['cosmetico', 'desodorante', 'aerossol'],
    'creme': ['cosmetico', 'higiene', 'pele', 'dental'],
    'dentifrício': ['creme', 'dental', 'fluoretado'],
    'vinagre': ['acido', 'acetico', 'bebida', 'conserva'],
    'desinfetante': ['tensioativo', 'limpeza', 'pinho'],
    'amaciante': ['tensioativo', 'roupas', 'suavizante'],
    'sabao': ['saboes', 'tensioativos', 'lavagem'],
    'papel': ['celulose', 'cartao', 'folha'],
    'lampada': ['eletrico', 'luminaria', 'led'],
    'extensao': ['eletrico', 'tomada', 'fio'],
    'usb': ['eletrico', 'conector', 'computador', 'entrada'],
    'pipoca': ['milho', 'cereal', 'estourado', 'microondas'],
    'polvilho': ['amido', 'mandioca', 'fecula', 'farinha'],
    'quinoa': ['cereal', 'grao', 'grão', 'semente'],
    'chia': ['semente', 'grao', 'óleo'],
    'granola': ['aveia', 'cereal', 'flocos', 'nozes'],
    'chinelo': ['calcado', 'sandalia', 'sola', 'borracha'],
    'sandalia': ['calcado', 'sapato', 'sola'],
    'ketchup': ['molho', 'tomate', 'condimento'],
    'maionese': ['molho', 'condimento', 'emulsao'],
    'energetico': ['bebida', 'cafeina', 'taurina'],
    'cachaca': ['aguardente', 'alcool', 'cana'],
    'whisky': ['bebida', 'alcool', 'destilado'],
    'picanha': ['carne', 'bovino', 'corte'],
    'nesquick': ['achocolatado', 'cacau', 'leite'],
    'whey': ['proteina', 'soro', 'leite', 'suplemento']
  };

  /** Palavras-chave → capítulo NCM (2 dígitos) para reforçar sugestões */
  var KEYWORD_CHAPTER = {
    '02': ['carne', 'bovino', 'suino', 'porco', 'vitela', 'aves', 'miudezas', 'fresca', 'congelada'],
    '03': ['peixe', 'camarao', 'camarão', 'sardinha', 'atum', 'file', 'filé', 'pescado', 'marisco', 'tilapia'],
    '04': ['leite', 'manteiga', 'creme', 'queijo', 'iogurte', 'laticinios', 'laticínio', 'uht', 'longa vida', 'ovos', 'ovo', 'cream cheese', 'ricota', 'coalhada'],
    '07': ['feijao', 'feijão', 'lentilha', 'grao', 'grão', 'ervilha', 'leguminosa', 'leguminosas', 'carioca', 'preto', 'batata', 'batatas', 'tuberculo', 'inhame', 'brocolis', 'abobrinha', 'berinjela', 'pepino', 'pimentao', 'cenoura', 'cebola', 'alho', 'tomate', 'alface', 'couve', 'repolho', 'couveflor', 'horticola'],
    '08': ['castanha', 'amendoim', 'amêndoa', 'noz', 'nozes', 'avelã', 'coco', 'fruta', 'fruto', 'frutas', 'seco', 'abacate', 'abacaxi', 'acerola', 'goiaba', 'manga', 'tâmara', 'figo', 'tangerina', 'laranja', 'uva', 'banana', 'maçã', 'maca', 'para', 'mamao', 'melao', 'morango', 'limao', 'melancia'],
    '09': ['cafe', 'café', 'cha', 'chá', 'mate', 'especiaria', 'canela', 'pimenta', 'torrado', 'torra', 'grao', 'grão'],
    '10': ['arroz', 'cereal', 'cereais', 'trigo', 'milho', 'aveia', 'cevada', 'centeio', 'agulhinha', 'integral', 'parboilizado', 'pipoca', 'quinoa', 'chia', 'linhaca', 'gergelim', 'granola'],
    '11': ['farinha', 'farinhas', 'amido', 'amidos', 'fecula', 'fécula', 'moagem', 'maizena', 'maisena', 'trigo', 'polvilho', 'tapioca', 'canjica'],
    '15': ['oleo', 'óleo', 'azeite', 'gordura', 'graxa', 'soja', 'girassol', 'algodao', 'algodão', 'vegetal'],
    '16': ['carne', 'linguica', 'linguiça', 'salsicha', 'presunto', 'bacon', 'embutido', 'fiambre', 'mortadela', 'apresuntado', 'calabresa', 'sardinha', 'lata', 'salame', 'hamburger'],
    '17': ['acucar', 'açúcar', 'confeito', 'mel', 'cristal', 'sacarose', 'mascavo', 'pirulito', 'chiclete', 'goma', 'marshmallow'],
    '18': ['cacau', 'achocolatado', 'achoc', 'chocolate', 'preparacoes', 'toddy', 'nescau', 'bombom', 'nutella'],
    '19': ['bolacha', 'biscoito', 'bolo', 'pao', 'pão', 'macarrao', 'macarrão', 'farinha', 'massas', 'cookie', 'espaguete', 'espag', 'wafer', 'creme', 'rosquinha', 'donut', 'croissant', 'baguete', 'focaccia', 'wrap', 'tortilha'],
    '20': ['conserva', 'geleia', 'geléia', 'doce', 'compota', 'ketchup', 'molho', 'suco', 'polpa', 'calda', 'caldas', 'edulcorada', 'xarope', 'acerola', 'tomate', 'laranja', 'lata', 'picles'],
    '21': ['tempero', 'condimento', 'maionese', 'mostarda', 'caldo', 'extrato', 'levadura', 'sazon', 'oregano', 'alecrim', 'salvia', 'colorau', 'paprica', 'ketchup'],
    '22': ['refrigerante', 'bebida', 'cerveja', 'suco', 'agua', 'água', 'vinho', 'whisky', 'vodka', 'refresco', 'coca', 'cola', 'gaseificada', 'aromatizada', 'guarana', 'mineral', 'energetico', 'cachaca', 'gin', 'alcool', 'alcoolico'],
    '25': ['sal', 'enxofre', 'gesso', 'cal', 'argila', 'mineral', 'refinado', 'cloreto'],
    '28': ['produto', 'quimico', 'químico', 'acido', 'ácido', 'fertilizante', 'inseticida', 'acetona', 'cetona'],
    '32': ['tinta', 'verniz', 'corretivo', 'pigmento', 'massa'],
    '33': ['perfume', 'cosmetico', 'maquiagem', 'higiene', 'sabonete', 'shampoo', 'creme', 'spray', 'desodorante', 'condicionador', 'protetor solar', 'hidratante', 'facial'],
    '34': ['detergente', 'sabao', 'sabão', 'tensioativo', 'surfactante', 'amaciante', 'desinfetante', 'liquido', 'lavagem', 'limpador', 'branqueador', 'desengordurante', 'cotonete'],
    '39': ['plastico', 'plástico', 'polimero', 'polímero', 'embalagem', 'tubo', 'folha', 'acetato', 'pet', 'pvc', 'tupperware', 'pote'],
    '48': ['papel', 'cartão', 'carton', 'folha', 'embalagem'],
    '61': ['roupa', 'vestuario', 'vestuário', 'camiseta', 'calca', 'calça', 'terno', 'malha', 'tecido', 'jaqueta', 'moletom', 'agasalho', 'casaco'],
    '67': ['cabelo', 'mechas', 'madeixa', 'peruca', 'pluma', 'acessorio'],
    '73': ['ferro', 'aco', 'aço', 'metal', 'parafuso', 'tubo', 'chapa', 'estrutura', 'prego', 'porca', 'chave', 'martelo', 'alicate', 'mangueira', 'regador', 'balde', 'assadeira', 'lixo'],
    '84': ['maquina', 'máquina', 'motor', 'bomba', 'computador', 'impressora', 'equipamento', 'aparelho', 'teclado', 'mouse', 'furadeira', 'parafusadeira', 'lixadeira', 'compressor', 'aspirador', 'webcam'],
    '85': ['eletrico', 'elétrico', 'eletronico', 'eletrônico', 'bateria', 'pilha', 'fio', 'lampada', 'lâmpada', 'celular', 'interruptor', 'adaptador', 'plugue', 'tomada', 'mouse', 'teclado', 'usb', 'conector', 'pendrive', 'hd externo', 'filtro linha'],
    '87': ['veiculo', 'veículo', 'carro', 'automovel', 'automóvel', 'moto', 'caminhao', 'caminhão', 'peca', 'peça', 'bike', 'bicicleta'],
    '96': ['fralda', 'higiene', 'descartavel'],
    '64': ['calçado', 'calcado', 'sapato', 'chinelo', 'sandalia', 'sandália', 'tenis', 'bota', 'sola'],
    '38': ['desodorante', 'purificador', 'desumidificador', 'repelente', 'incenso', 'raticida', 'inseticida', 'espiral'],
    '94': ['mobilia', 'móvel', 'varal', 'prendedor', 'lixeira', 'organizador']
  };

  /**
   * Pré-processa descrição de produto: remove quantidade+unidade (2UN, 350ML, 400G, KG…),
   * blocos de promo (PROM+BAT) e decimais de preço (0,01); expande abreviações (LIQ→liquido).
   */
  function preprocessProductDescription(str) {
    if (typeof str !== 'string' || !str.trim()) return '';
    var s = str.trim();
    s = s.replace(/\d+[\d,.]*\s*(UN|UNID|ML|G|GR|KG|MG|LT|L|CM|MM|CX|PCT|PAC)\b/gi, ' ');
    s = s.replace(/\d+[\d,.]*(UN|UNID|ML|G|GR|KG|MG|LT|L|CM|MM|CX|PCT|PAC)\b/gi, ' ');
    s = s.replace(/\s+KG\b/gi, ' ');
    s = s.replace(/\bPROM\+BAT\b/gi, ' ');
    s = s.replace(/\b\d+[,.]\d{2}\b/g, ' ');
    s = s.replace(/\bLIQ\b/gi, ' liquido ');
    s = s.replace(/\bACHOC\b/gi, ' achocolatado ');
    s = s.replace(/\bREF\b/gi, ' refrigerante ');
    s = s.replace(/\bESPAG\b/gi, ' espaguete ');
    s = s.replace(/\bFRAUD\s+DEL\b/gi, ' fralda ');
    s = s.replace(/\bFRAUD\b/gi, ' fralda ');
    s = s.replace(/\bMASS\s+CORRIG\b/gi, ' massa corretiva ');
    s = s.replace(/\bCORRIG\b/gi, ' corretivo ');
    s = s.replace(/\bUHT\b/gi, ' leite ');
    s = s.replace(/\bLT\b/gi, ' litro ');
    s = s.replace(/\bML\b/gi, ' ');
    s = s.replace(/\bCX\b/gi, ' caixa ');
    s = s.replace(/\bPCT\b/gi, ' pacote ');
    s = s.replace(/\bPAC\b/gi, ' pacote ');
    s = s.replace(/\b[A-Z]{2}\d{4,}[-]?[A-Z0-9]*\b/gi, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  var MIN_TOKEN_LEN = 3;

  function normalizeText(str) {
    if (typeof str !== 'string' || !str.trim()) return [];
    var s = str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return s.split(' ').filter(function (w) {
      if (!w || STOPWORDS.has(w) || NOISE_TOKENS.has(w)) return false;
      if (w.length >= MIN_TOKEN_LEN) return true;
      return false;
    });
  }

  function getChapterFromKeywords(tokens) {
    var score = {};
    var firstHit = {};
    var list, i, cap, t;
    for (cap in KEYWORD_CHAPTER) {
      if (!Object.prototype.hasOwnProperty.call(KEYWORD_CHAPTER, cap)) continue;
      list = KEYWORD_CHAPTER[cap];
      for (i = 0; i < tokens.length; i++) {
        t = tokens[i];
        if (list.indexOf(t) !== -1) {
          score[cap] = (score[cap] || 0) + 1;
          if (firstHit[cap] === undefined) firstHit[cap] = i;
        }
      }
    }
    var best = '';
    var max = 0;
    var bestFirst = 999;
    for (var k in score) {
      if (score[k] > max || (score[k] === max && (firstHit[k] || 999) < bestFirst)) {
        max = score[k];
        best = k;
        bestFirst = firstHit[k] || 999;
      }
    }
    return best;
  }

  var STORAGE_SYNONYMS_KEY = 'ncmQuerySynonyms';
  var STORAGE_ALIASES_KEY = 'ncmCustomAliases';

  function getMergedAliases() {
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_ALIASES_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_ALIASES_KEY)) || {};
      }
    } catch (e) {}
    var out = {};
    for (var k in NCM_ALIASES) { if (Object.prototype.hasOwnProperty.call(NCM_ALIASES, k)) out[k] = NCM_ALIASES[k]; }
    for (var k in custom) { if (Object.prototype.hasOwnProperty.call(custom, k)) out[k] = custom[k]; }
    return out;
  }

  function getMergedSynonyms() {
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_SYNONYMS_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_SYNONYMS_KEY)) || {};
      }
    } catch (e) {}
    var out = {};
    for (var k in QUERY_SYNONYMS) { if (Object.prototype.hasOwnProperty.call(QUERY_SYNONYMS, k)) out[k] = QUERY_SYNONYMS[k].slice(); }
    for (var k in custom) { if (Object.prototype.hasOwnProperty.call(custom, k)) out[k] = (out[k] || []).concat(custom[k]); }
    return out;
  }

  function expandTokens(tokens) {
    var syn = getMergedSynonyms();
    var seen = {};
    var out = [];
    var i, t, list, j, s, parts, k, w;
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i];
      if (!seen[t]) { seen[t] = true; out.push(t); }
      list = syn[t];
      if (list && list.length) {
        for (j = 0; j < list.length; j++) {
          s = list[j].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          parts = s.split(' ');
          for (k = 0; k < parts.length; k++) {
            w = parts[k];
            if (w.length >= 3 && !STOPWORDS.has(w) && !seen[w]) { seen[w] = true; out.push(w); }
          }
        }
      }
    }
    return out;
  }

  function flattenNcmTable(data) {
    var out = [];
    if (!data || typeof data !== 'object') return out;

    var levelKey, root, caps, capKey, cap, ncms, ncmKey, n, c, c4, c6, d4, d6, full;
    for (levelKey in data) {
      if (!Object.prototype.hasOwnProperty.call(data, levelKey)) continue;
      root = data[levelKey];
      if (!root || !root.capitulos) continue;
      caps = root.capitulos;
      for (capKey in caps) {
        if (!Object.prototype.hasOwnProperty.call(caps, capKey)) continue;
        cap = caps[capKey];
        ncms = cap.ncms || {};
        for (ncmKey in ncms) {
          if (!Object.prototype.hasOwnProperty.call(ncms, ncmKey)) continue;
          n = ncms[ncmKey];
          if (!n || !n.codigo || !n.descricao) continue;
          c = String(n.codigo).replace(/\D/g, '');
          if (c.length !== 8) continue;

          c4 = c.slice(0, 4);
          c6 = c.slice(0, 6);
          var d2 = (cap && cap.descricao) ? cap.descricao : '';
          d4 = (ncms[c4] && ncms[c4].descricao) ? ncms[c4].descricao : '';
          d6 = (ncms[c6] && ncms[c6].descricao) ? ncms[c6].descricao : '';
          if (!d6 && c.length > 4) {
            for (var k = 5; k >= 4; k--) {
              var pk = c.slice(0, k);
              if (ncms[pk] && ncms[pk].descricao) { d6 = ncms[pk].descricao; break; }
            }
          }
          full = [d2, d4, d6, n.descricao].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

          out.push({
            codigo: c,
            descricao: n.descricao,
            descricaoCompleta: full || n.descricao,
            descricao2: d2,
            descricao4: d4,
            descricao6: d6,
            capitulo: String(capKey).replace(/\D/g, '').slice(0, 2)
          });
        }
      }
    }
    return out;
  }

  function ensureIndex() {
    if (INDEX_BUILT && INDEX.length > 0) return;
    var data = typeof window !== 'undefined' && window.NCM_TABELA_DATA;
    if (!data) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('ncm-motor: NCM_TABELA_DATA não encontrado. Carregue Tabela_NCM.js antes.');
      }
      return;
    }
    INDEX = flattenNcmTable(data);
    INDEX_BUILT = true;
  }

  function formatNcm(codigo) {
    var c = String(codigo || '').replace(/\D/g, '');
    if (c.length >= 8) {
      return c.slice(0, 4) + '.' + c.slice(4, 6) + '.' + c.slice(6, 8);
    }
    return c;
  }

  function matchToken(tok, norm) {
    if (!norm || !norm.length || (tok && tok.length < 3)) return false;
    return norm.some(function (d) {
      if (d.length < 3) return false;
      var idx = d.indexOf(tok);
      if (idx === -1) return false;
      var next = d[idx + tok.length];
      if (next === undefined) return true;
      if (next === 's' && idx + tok.length + 1 === d.length) return true;
      return !/[a-z0-9]/.test(next);
    });
  }

  function matchExact(tok, norm) {
    if (!norm || !norm.length || (tok && tok.length < 3)) return false;
    return norm.indexOf(tok) !== -1;
  }

  /**
   * Verifica se há overlap entre tokens da query e a descrição NCM (8 dígitos).
   * Se ncmCodigo for informado, acrescenta NCM_ALIASES para enriquecer a descrição.
   * Usado pela camada IA/embeddings para evitar sugestões absurdas (ex.: achocolatado → fios de aço).
   */
  function hasTokenOverlap(queryTokens, ncmDesc, ncmCodigo) {
    if (!queryTokens || !queryTokens.length) return false;
    var desc = String(ncmDesc || '');
    var aliases = getMergedAliases();
    if (ncmCodigo && aliases[ncmCodigo]) desc += ' ' + aliases[ncmCodigo];
    if (!desc.trim()) return false;
    var norm = normalizeText(desc);
    if (!norm.length) return false;
    for (var i = 0; i < queryTokens.length; i++) {
      if (matchToken(queryTokens[i], norm)) return true;
    }
    return false;
  }

  /**
   * Verificação pós-busca: checa se a NCM resultante faz sentido com o nome original do produto.
   * Monta a descrição completa da hierarquia (01→0101→01019000) e verifica overlap de tokens.
   * Rejeita NCMs cuja descrição completa não tem relação com o produto (ex.: refrigerante → 01019000 cavalos).
   */
  function verificarNCMComProduto(ncm, produtoOriginal) {
    if (!ncm || !produtoOriginal || typeof produtoOriginal !== 'string') return true;
    var cleaned = preprocessProductDescription(produtoOriginal);
    var tokens = normalizeText(cleaned || produtoOriginal);
    var expanded = expandTokens(tokens);
    var useTokens = expanded.length > tokens.length ? expanded : tokens;
    var c4 = ncm.codigo ? String(ncm.codigo).replace(/\D/g, '').slice(0, 4) : '';
    if (rejeitarPorIncompatibilidadeCarne(useTokens, c4)) return false;
    var descCompleta = [
      ncm.descricao2 || '',
      ncm.descricao4 || '',
      ncm.descricao6 || '',
      ncm.descricao || ''
    ].filter(Boolean).join(' ');
    if (!descCompleta.trim()) return true;
    if (!useTokens.length) return true;
    return hasTokenOverlap(useTokens, descCompleta, ncm.codigo);
  }

  /**
   * Filtra lista de NCMs removendo as que não passam na verificação com o produto original.
   * Proteção: se o filtro remover todos, mantém até 3 primeiros como fallback para evitar 0 acidental.
   */
  function filtrarResultadosPorProduto(resultados, produtoOriginal) {
    if (!Array.isArray(resultados) || !produtoOriginal) return resultados;
    var filtrado = resultados.filter(function (r) {
      return verificarNCMComProduto(r, produtoOriginal);
    });
    if (filtrado.length === 0 && resultados.length > 0) {
      return resultados.slice(0, 3);
    }
    return filtrado;
  }

  /**
   * Retorna o capítulo (2 dígitos) sugerido para a descrição do produto, ou null.
   * Usado pela camada IA para filtrar embeddings por domínio.
   */
  function getChapterHint(descricaoProduto) {
    var cleaned = preprocessProductDescription(descricaoProduto);
    var tokens = normalizeText(cleaned || descricaoProduto);
    if (!tokens.length) return null;
    var cap = getChapterFromKeywords(tokens);
    return cap || null;
  }

  /**
   * Retorna tokens normalizados do produto (pré-processo + normalize), sem expansão por sinônimos.
   * Usado pela camada IA para overlap e filtros.
   */
  function getTokensForProduct(descricaoProduto) {
    var cleaned = preprocessProductDescription(descricaoProduto);
    return normalizeText(cleaned || descricaoProduto);
  }

  /**
   * Retorna tokens expandidos (pré-processo + normalize + sinônimos).
   * Usado na IA para overlap: termos como "achoc" → "achocolatado","cacau", etc., garantem
   * overlap com descrições NCM que citam "cacau" mas não "achocolatado".
   */
  function getExpandedTokensForProduct(descricaoProduto) {
    var cleaned = preprocessProductDescription(descricaoProduto);
    var tokens = normalizeText(cleaned || descricaoProduto);
    return expandTokens(tokens);
  }

  /**
   * Calcula score de token match entre tokens da query e descrição (0 a 1).
   */
  function scoreTokenMatch(useTokens, descricao, addAliases) {
    var r = scoreTokenMatchDetailed(useTokens, descricao);
    return r.score;
  }

  /**
   * Score detalhado para validação: retorna score, hits, genericOnly, exactHits, tokenCoverage, hasStrongMatch.
   */
  function scoreTokenMatchDetailed(useTokens, descricao) {
    var out = { score: 0, hits: 0, genericOnly: true, exactHits: 0, tokenCoverage: 0, hasStrongMatch: false };
    if (!useTokens || !useTokens.length || !descricao) return out;
    var desc = String(descricao);
    var norm = normalizeText(desc);
    if (!norm.length) return out;
    var countNonGeneric = 0;
    for (var i = 0; i < useTokens.length; i++) {
      if (useTokens[i] && useTokens[i].length >= 2 && !NCM_GENERIC.has(useTokens[i])) countNonGeneric++;
    }
    var hits = 0;
    var exactHits = 0;
    var tw = 0;
    var hasNonGeneric = false;
    var hasStrongMatch = false;
    for (var j = 0; j < useTokens.length; j++) {
      var t = useTokens[j];
      if (!t || t.length < 2) continue;
      var m = matchToken(t, norm);
      if (m) {
        hits++;
        var exact = matchExact(t, norm);
        if (exact) {
          exactHits++;
          if (!NCM_GENERIC.has(t)) hasStrongMatch = true;
        }
        tw += 0.5 + (exact ? 0.2 : 0);
        if (!NCM_GENERIC.has(t)) hasNonGeneric = true;
      }
    }
    out.hits = hits;
    out.exactHits = exactHits;
    out.genericOnly = !hasNonGeneric;
    out.hasStrongMatch = hasStrongMatch;
    out.tokenCoverage = useTokens.length > 0 ? hits / useTokens.length : 0;
    out.score = hits === 0 ? 0 : Math.min(1, (tw / useTokens.length) * 1.5);
    return out;
  }

  /** Verifica se a descrição é muito genérica (poucas palavras específicas). */
  function descricaoMuitoGenerica(descricao) {
    if (!descricao || typeof descricao !== 'string') return true;
    var norm = normalizeText(descricao);
    if (!norm || norm.length === 0) return true;
    var words = norm.filter(function (w) { return w && w.length >= 3; });
    if (words.length === 0) return true;
    var genericas = 0;
    for (var i = 0; i < words.length; i++) {
      if (DESC_GENERICA.has(words[i])) genericas++;
    }
    return genericas === words.length;
  }

  /** Tokens que indicam produto de aves: rejeitar NCMs de bovino/suíno (0201, 0202, 0203). */
  var AVES_SIGNAL = { 'aves': 1, 'frango': 1, 'frangos': 1, 'galinha': 1, 'peru': 1, 'codorna': 1, 'gallus': 1 };
  /** Tokens que indicam bovino: rejeitar NCMs de aves (0207). */
  var BOVINO_SIGNAL = { 'bovino': 1, 'bovina': 1, 'vitela': 1, 'picanha': 1, 'alcatra': 1, 'contrafile': 1, 'costela': 1, 'maminha': 1 };
  /** Tokens que indicam suíno: rejeitar NCMs de aves (0207) e bovino (0201, 0202). */
  var SUINO_SIGNAL = { 'suino': 1, 'porco': 1, 'lombo': 1, 'bacon': 1 };

  function rejeitarPorIncompatibilidadeCarne(useTokens, c4) {
    if (!useTokens || !useTokens.length || !c4) return false;
    var c4n = String(c4).replace(/\D/g, '').slice(0, 4);
    var hasAves = false, hasBovino = false, hasSuino = false;
    for (var i = 0; i < useTokens.length; i++) {
      var t = useTokens[i];
      if (AVES_SIGNAL[t]) hasAves = true;
      if (BOVINO_SIGNAL[t]) hasBovino = true;
      if (SUINO_SIGNAL[t]) hasSuino = true;
    }
    if (hasAves && (c4n === '0201' || c4n === '0202' || c4n === '0203')) return true;
    if (hasBovino && c4n === '0207') return true;
    if (hasSuino && (c4n === '0207' || c4n === '0201' || c4n === '0202')) return true;
    return false;
  }

  /** Limites mínimos para validação em cada nível da hierarquia (aprovado para seguir). */
  var VALIDACAO = {
    level: {
      minScore: 0.08,
      minHits: 1,
      minExactHits: 0,
      minTokenCoverage: 0.08,
      rejeitarGenericOnly: true,
      genericOnlyMinScore: 0.18,
      rejeitarDescGenerica: true,
      requireStrongMatch: false
    },
    grupo: {
      minScore: 0.06,
      minHits: 1,
      minExactHits: 0,
      minTokenCoverage: 0.06,
      rejeitarGenericOnly: true,
      genericOnlyMinScore: 0.15,
      rejeitarDescGenerica: true,
      requireStrongMatch: false,
      rejeitarIncoerenteCapitulo: true
    },
    subgrupo: {
      minScore: 0.04,
      minHits: 0,
      minExactHits: 0,
      minTokenCoverage: 0.04,
      rejeitarGenericOnly: false,
      genericOnlyMinScore: 0.12,
      rejeitarDescGenerica: true,
      requireStrongMatch: false
    },
    classificacao: {
      minScore: 0.03,
      minHits: 0,
      minExactHits: 0,
      minTokenCoverage: 0.03,
      rejeitarGenericOnly: true,
      genericOnlyMinScore: 0.12,
      rejeitarDescGenerica: false,
      requireStrongMatch: false
    }
  };

  function validarNivel(useTokens, descricao, nivel) {
    var cfg = VALIDACAO[nivel];
    if (!cfg) return true;
    if (!descricao || !String(descricao).trim()) return nivel !== 'level' && nivel !== 'grupo';
    if (cfg.rejeitarDescGenerica && descricaoMuitoGenerica(descricao)) return false;
    var r = scoreTokenMatchDetailed(useTokens, descricao);
    if (r.score < cfg.minScore) return false;
    if (cfg.genericOnlyMinScore && r.genericOnly && r.hits > 0 && r.score < cfg.genericOnlyMinScore) return false;
    if (cfg.minHits > 0 && r.hits < cfg.minHits) return false;
    if (cfg.minExactHits > 0 && r.exactHits < cfg.minExactHits) return false;
    if (cfg.minTokenCoverage > 0 && r.tokenCoverage < cfg.minTokenCoverage) return false;
    if (cfg.rejeitarGenericOnly && r.genericOnly && r.hits > 0) return false;
    if (cfg.requireStrongMatch && !r.hasStrongMatch) return false;
    return true;
  }

  /** Valida coerência: capítulo sugerido pelo produto deve alinhar com o grupo. */
  function validarCoerenciaCapitulo(useTokens, capKey) {
    var hint = getChapterFromKeywords(useTokens);
    if (!hint) return true;
    var cap = String(capKey || '').replace(/\D/g, '').slice(0, 2);
    return cap === hint;
  }

  /** Valida caminho em cascata: Level+Grupo combinados precisam de score mínimo. */
  function validarCaminhoCascata(sL, sG) {
    var combo = sL * 0.6 + sG * 0.4;
    return combo >= 0.06 && (sL >= 0.05 || sG >= 0.08);
  }

  /**
   * Busca hierárquica: Level -> Grupo (2 díg) -> Subgrupo (4 díg) -> Classificação (8 díg).
   * Usa texto enriquecido pela API (ex.: Wikipedia) para melhor identificação do reino/categoria.
   * Pesos decrescentes: Level 0.4, Grupo 0.3, Subgrupo 0.2, Classificação 0.1.
   */
  function sugerirNCMHierarquico(descricaoProdutoEnriquecida, opts) {
    opts = opts || {};
    var limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 20), 50);
    var data = typeof window !== 'undefined' && window.NCM_TABELA_DATA;
    if (!data || typeof data !== 'object') return [];

    var cleaned = preprocessProductDescription(descricaoProdutoEnriquecida);
    var tokens = normalizeText(cleaned || descricaoProdutoEnriquecida);
    var expanded = expandTokens(tokens);
    var useTokens = expanded.length > tokens.length ? expanded : tokens;
    if (!useTokens.length) return [];

    var results = [];
    var seen = {};
    var W_LEVEL = 0.4;
    var W_GRUPO = 0.3;
    var W_SUBGRUPO = 0.2;
    var W_CLASS = 0.1;

    var chapterHint = getChapterFromKeywords(useTokens);
    var levelKey, level, caps, capKey, cap, ncms, ncmKey, n, cod, c4, d4, d8, sL, sG, sS, sC, total;
    for (levelKey in data) {
      if (!Object.prototype.hasOwnProperty.call(data, levelKey)) continue;
      level = data[levelKey];
      if (!level || !level.capitulos) continue;

      sL = scoreTokenMatch(useTokens, level.descricao || '');
      var levelPassed = validarNivel(useTokens, level.descricao || '', 'level');
      var restrictToChapter = null;
      if (!levelPassed) {
        if (chapterHint && level.capitulos[chapterHint]) {
          restrictToChapter = chapterHint;
        } else {
          continue;
        }
      }

      caps = level.capitulos;
      for (capKey in caps) {
        if (restrictToChapter && String(capKey).replace(/\D/g, '').slice(0, 2) !== restrictToChapter) continue;
        if (!Object.prototype.hasOwnProperty.call(caps, capKey)) continue;
        cap = caps[capKey];
        ncms = cap.ncms || {};

        sG = scoreTokenMatch(useTokens, cap.descricao || '');
        if (!restrictToChapter && !validarNivel(useTokens, cap.descricao || '', 'grupo')) continue;
        if (!restrictToChapter && !validarCaminhoCascata(sL, sG)) continue;
        if (VALIDACAO.grupo.rejeitarIncoerenteCapitulo && !validarCoerenciaCapitulo(useTokens, capKey)) continue;

        for (ncmKey in ncms) {
          if (!Object.prototype.hasOwnProperty.call(ncms, ncmKey)) continue;
          n = ncms[ncmKey];
          if (!n || !n.codigo) continue;
          cod = String(n.codigo).replace(/\D/g, '');
          if (cod.length !== 8) continue;

          if (seen[cod]) continue;

          c4 = cod.slice(0, 4);
          if (rejeitarPorIncompatibilidadeCarne(useTokens, c4)) continue;

          d4 = (ncms[c4] && ncms[c4].descricao) ? ncms[c4].descricao : '';
          d8 = n.descricao || '';
          if (d4 && !validarNivel(useTokens, d4, 'subgrupo') && !(restrictToChapter && hasTokenOverlap(useTokens, d4, cod))) continue;
          if (!validarNivel(useTokens, d8, 'classificacao') && !hasTokenOverlap(useTokens, d8, cod)) continue;

          seen[cod] = true;

          sS = scoreTokenMatch(useTokens, d4);
          sC = scoreTokenMatch(useTokens, d8);
          var aliases = getMergedAliases();
          if (aliases[cod]) sC = Math.max(sC, scoreTokenMatch(useTokens, aliases[cod]));

          total = W_LEVEL * sL + W_GRUPO * sG + W_SUBGRUPO * sS + W_CLASS * sC;
          if (total < (restrictToChapter ? 0.05 : 0.08)) continue;

          var d2 = cap.descricao || '';
          var d6 = '';
          for (var k = 6; k >= 5; k--) {
            var pk = cod.slice(0, k);
            if (ncms[pk] && ncms[pk].descricao) { d6 = ncms[pk].descricao; break; }
          }
          var full = [d2, d4, d6, d8].filter(Boolean).join(' ');

          results.push({
            codigo: cod,
            descricao: d8,
            descricaoCompleta: full,
            descricao2: d2,
            descricao4: d4,
            descricao6: d6,
            capitulo: String(capKey).replace(/\D/g, '').slice(0, 2),
            score: Math.round(total * 1000) / 1000,
            codigoFormatado: formatNcm(cod),
            _sL: sL,
            _sG: sG,
            _sS: sS,
            _sC: sC
          });
        }
      }
    }

    if (results.length === 0) {
      var fallback = sugerirNCM(descricaoProdutoEnriquecida, { limit: limit, prefer8: true });
      if (fallback.length > 0) return fallback;
    }

    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if ((b._sL || 0) !== (a._sL || 0)) return (b._sL || 0) - (a._sL || 0);
      if ((b._sG || 0) !== (a._sG || 0)) return (b._sG || 0) - (a._sG || 0);
      if ((b._sS || 0) !== (a._sS || 0)) return (b._sS || 0) - (a._sS || 0);
      return (b._sC || 0) - (a._sC || 0);
    });

    return results.slice(0, limit).map(function (r) {
      delete r._sL;
      delete r._sG;
      delete r._sS;
      delete r._sC;
      return r;
    });
  }

  function mergeResults(a, b, maxLen) {
    var seen = {};
    var out = [];
    var i, r;
    for (i = 0; i < a.length; i++) {
      r = a[i];
      if (!seen[r.codigo]) { seen[r.codigo] = true; out.push(r); }
    }
    for (i = 0; i < b.length && out.length < (maxLen || 50); i++) {
      r = b[i];
      if (!seen[r.codigo]) { seen[r.codigo] = true; out.push(r); }
    }
    out.sort(function (x, y) { return (y.score || 0) - (x.score || 0); });
    return out;
  }

  /**
   * Executa a busca interna. useTokens = tokens da query (ou expandidos); restrictChapter = cap. 2 dígitos ou null; minScore = limite mínimo (default 0.45).
   */
  function runSearch(useTokens, restrictChapter, minScore) {
    minScore = typeof minScore === 'number' ? minScore : 0.45;
    var chapterHint = getChapterFromKeywords(useTokens);
    var results = [];
    var i, item, norm4, norm6, norm8, normFull, j, t, m4, m6, m8, mFull, w, tw, score, capMatch;
    var hits4, hits6, hits8, genericOnly;

    for (i = 0; i < INDEX.length; i++) {
      item = INDEX[i];
      if (restrictChapter && item.capitulo !== restrictChapter) continue;

      var norm2 = normalizeText(item.descricao2 || '');
      norm4 = normalizeText(item.descricao4 || '');
      norm6 = normalizeText(item.descricao6 || '');
      var aliases = getMergedAliases();
      var desc8 = (item.descricao || '') + ' ' + (aliases[item.codigo] || '');
      norm8 = normalizeText(desc8);
      var descFull = (item.descricaoCompleta || item.descricao || '') + ' ' + (aliases[item.codigo] || '');
      normFull = normalizeText(descFull);

      tw = 0;
      genericOnly = true;
      var hits2 = 0;
      hits4 = 0;
      hits6 = 0;
      hits8 = 0;
      var tokensMatched = 0;
      for (j = 0; j < useTokens.length; j++) {
        t = useTokens[j];
        if (!t || t.length < 2) continue;
        var m2 = matchToken(t, norm2);
        m4 = matchToken(t, norm4);
        m6 = matchToken(t, norm6);
        m8 = matchToken(t, norm8);
        mFull = !m2 && !m4 && !m6 && !m8 ? matchToken(t, normFull) : false;
        if (m2) hits2++;
        if (m4) hits4++;
        if (m6) hits6++;
        if (m8) hits8++;
        if (!m2 && !m4 && !m6 && !m8 && !mFull) continue;
        tokensMatched++;
        if (!NCM_GENERIC.has(t)) genericOnly = false;
        w = (m2 ? 0.45 : 0) + (m4 ? 0.30 : 0) + (m6 ? 0.15 : 0) + (m8 ? 0.10 : 0) + (mFull && !m8 ? 0.35 : 0);
        if (m2 && matchExact(t, norm2)) w += 0.1;
        if (m8 && matchExact(t, norm8)) w += 0.05;
        tw += w;
      }
      if (tw <= 0) continue;
      if (hits2 + hits4 + hits6 + hits8 < 1) continue;
      if (genericOnly) tw *= 0.4;

      score = tw / Math.max(tokensMatched, 1);
      capMatch = chapterHint && item.capitulo === chapterHint ? 1.5 : 1;
      score *= capMatch;
      if (chapterHint && item.capitulo !== chapterHint) score *= 0.78;
      if (chapterHint === '22' && item.capitulo === '84') continue;
      if (score < minScore) continue;
      if (rejeitarPorIncompatibilidadeCarne(useTokens, item.codigo ? String(item.codigo).slice(0, 4) : '')) continue;

      results.push({
        codigo: item.codigo,
        descricao: item.descricao,
        descricaoCompleta: item.descricaoCompleta || item.descricao,
        descricao2: item.descricao2 || '',
        descricao4: item.descricao4 || '',
        descricao6: item.descricao6 || '',
        capitulo: item.capitulo,
        score: Math.round(score * 1000) / 1000,
        codigoFormatado: formatNcm(item.codigo),
        _hits2: hits2,
        _hits4: hits4,
        _hits6: hits6,
        _hits8: hits8,
        _genericOnly: genericOnly,
        _tokensMatched: tokensMatched,
        _tokenCoverage: useTokens.length ? Math.round((tokensMatched / useTokens.length) * 100) / 100 : 1
      });
    }

    /* Ordenação: score; depois prefere match em níveis mais amplos (desc2 > desc4 > desc6 > desc8). */
    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var ah2 = a._hits2 || 0, bh2 = b._hits2 || 0;
      if (bh2 !== ah2) return bh2 - ah2;
      var ah4 = a._hits4 || 0, bh4 = b._hits4 || 0;
      if (bh4 !== ah4) return bh4 - ah4;
      var ah6 = a._hits6 || 0, bh6 = b._hits6 || 0;
      if (bh6 !== ah6) return bh6 - ah6;
      var ah8 = a._hits8 || 0, bh8 = b._hits8 || 0;
      if (bh8 !== ah8) return bh8 - ah8;
      var acov = a._tokenCoverage || 0, bcov = b._tokenCoverage || 0;
      if (bcov !== acov) return bcov - acov;
      var alen = (a.descricao || '').length, blen = (b.descricao || '').length;
      if (blen !== alen) return blen - alen;
      return (b.codigo || '').localeCompare(a.codigo || '');
    });
    return results;
  }

  /**
   * Sugere NCM(s) para um produto a partir da descrição.
   * @param {string} descricaoProduto - Nome/descrição do produto
   * @param {object} opts - { limit: number, prefer8: boolean }
   * @returns {Array<{ codigo, descricao, capitulo, score, codigoFormatado }>}
   */
  function sugerirNCM(descricaoProduto, opts) {
    opts = opts || {};
    var limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 20), 50);

    ensureIndex();
    if (INDEX.length === 0) return [];

    var cleaned = preprocessProductDescription(descricaoProduto);
    var tokens = normalizeText(cleaned || descricaoProduto);
    if (tokens.length === 0) return [];

    var chapterHint = getChapterFromKeywords(tokens);
    var expanded = expandTokens(tokens);
    var results = runSearch(tokens, null, 0.45);

    if (results.length < 5 && expanded.length > tokens.length) {
      var r2 = runSearch(expanded, null, 0.38);
      results = mergeResults(results, r2, limit * 2);
    }
    if (results.length < 5 && chapterHint) {
      var r3 = runSearch(expanded.length > tokens.length ? expanded : tokens, chapterHint, 0.32);
      results = mergeResults(results, r3, limit * 2);
    }
    if (results.length < 3) {
      var r4 = runSearch(expanded.length > tokens.length ? expanded : tokens, null, 0.22);
      results = mergeResults(results, r4, limit * 2);
    }

    if (chapterHint && results.length > 1) {
      var fromCap = [], other = [];
      for (var ri = 0; ri < results.length; ri++) {
        if (results[ri].capitulo === chapterHint) fromCap.push(results[ri]);
        else other.push(results[ri]);
      }
      if (fromCap.length > 0) results = fromCap.concat(other);
    }

    return results.slice(0, limit).map(function (r) {
      delete r._hits2;
      delete r._hits4;
      delete r._hits6;
      delete r._hits8;
      delete r._genericOnly;
      delete r._tokensMatched;
      delete r._tokenCoverage;
      return r;
    });
  }

  /**
   * Correlaciona produto + NCM informado: verifica se o NCM faz sentido para o produto.
   * @param {string} descricaoProduto
   * @param {string} ncmInformado - Código (8 dígitos)
   * @returns {object} { ok, sugestoes, ncmInformadoFormatado, mensagem }
   */
  function correlacionar(descricaoProduto, ncmInformado) {
    var cod = String(ncmInformado || '').replace(/\D/g, '');
    var sugestoes = sugerirNCM(descricaoProduto, { limit: 10, prefer8: true });
    var encontrado = sugestoes.find(function (s) {
      return s.codigo === cod || (s.codigo.length >= 6 && cod.indexOf(s.codigo) === 0) || (cod.length >= 6 && s.codigo.indexOf(cod) === 0);
    });
    var mesmoCapitulo = cod.length >= 2 && sugestoes.some(function (s) { return s.capitulo === cod.slice(0, 2); });

    var ok = !!encontrado;
    var msg = ok
      ? 'NCM compatível com o produto.'
      : mesmoCapitulo
        ? 'NCM em capítulo relacionado. Confira a descrição.'
        : 'NCM pode não corresponder ao produto. Verifique as sugestões.';

    return {
      ok: ok,
      sugestoes: sugestoes,
      ncmInformadoFormatado: formatNcm(cod),
      mensagem: msg
    };
  }

  function addQuerySynonym(termo, termosExtras) {
    var key = (normalizeText(termo)[0] || termo.toLowerCase().replace(/\s+/, '')).trim();
    if (!key || key.length < 3) return;
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_SYNONYMS_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_SYNONYMS_KEY)) || {};
      }
    } catch (e) {}
    var list = Array.isArray(termosExtras) ? termosExtras : [].concat(termosExtras);
    custom[key] = (custom[key] || []).concat(list);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_SYNONYMS_KEY, JSON.stringify(custom));
    } catch (e) {}
  }

  /**
   * Adiciona alias customizado para uma NCM (persistido em localStorage).
   * Usado quando o usuário informa a NCM correta após busca retornar 0 resultados.
   * @param {string} codigo - Código NCM 8 dígitos
   * @param {string} termos - Termos extras para matching (ex.: nome do produto + descrição)
   */
  function addNcmAlias(codigo, termos) {
    var c = String(codigo || '').replace(/\D/g, '').slice(0, 8);
    if (c.length !== 8) return false;
    var t = String(termos || '').trim();
    if (!t) return false;
    var custom = {};
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_ALIASES_KEY)) {
        custom = JSON.parse(localStorage.getItem(STORAGE_ALIASES_KEY)) || {};
      }
    } catch (e) {}
    var existing = custom[c] ? custom[c] + ' ' : '';
    custom[c] = (existing + t).replace(/\s+/g, ' ').trim();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_ALIASES_KEY, JSON.stringify(custom));
        return true;
      }
    } catch (e) {}
    return false;
  }

  function getQuerySynonyms() {
    return getMergedSynonyms();
  }

  /**
   * Busca NCM por código (8 dígitos). Usado no Controle de Vencimentos.
   * @param {string} codigo - Código NCM (aceita formatação 0000.00.00 ou 00000000)
   * @returns {{ codigo, descricao, descricao4, descricao6, capitulo, codigoFormatado } | null}
   */
  function buscarPorCodigo(codigo) {
    ensureIndex();
    if (INDEX.length === 0) return null;
    var c = String(codigo || '').replace(/\D/g, '');
    if (c.length < 8) return null;
    if (c.length > 8) c = c.slice(0, 8);
    for (var i = 0; i < INDEX.length; i++) {
      if (INDEX[i].codigo === c) {
        var item = INDEX[i];
        return {
          codigo: item.codigo,
          descricao: item.descricao,
          descricao2: item.descricao2 || '',
          descricao4: item.descricao4 || '',
          descricao6: item.descricao6 || '',
          capitulo: item.capitulo,
          codigoFormatado: formatNcm(item.codigo)
        };
      }
    }
    return null;
  }

  /**
   * Retorna exemplos de NCMs vigentes de um capítulo (para sugestão quando NCM vencida).
   * @param {string} chapter - Capítulo (2 dígitos)
   * @param {number} limit - Máximo de NCMs a retornar
   * @returns {Array<{codigo, codigoFormatado}>}
   */
  function getNcmsByChapter(chapter, limit) {
    ensureIndex();
    if (INDEX.length === 0) return [];
    var ch = String(chapter || '').replace(/\D/g, '').slice(0, 2);
    if (!ch) return [];
    var out = [];
    var max = Math.min(limit || 5, 10);
    for (var i = 0; i < INDEX.length && out.length < max; i++) {
      if (INDEX[i].capitulo === ch) {
        out.push({ codigo: INDEX[i].codigo, codigoFormatado: formatNcm(INDEX[i].codigo) });
      }
    }
    return out;
  }

  window.ncmMotor = {
    sugerirNCM: sugerirNCM,
    sugerirNCMHierarquico: sugerirNCMHierarquico,
    buscarPorCodigo: buscarPorCodigo,
    getNcmsByChapter: getNcmsByChapter,
    correlacionar: correlacionar,
    normalizeText: normalizeText,
    formatNcm: formatNcm,
    ensureIndex: ensureIndex,
    addQuerySynonym: addQuerySynonym,
    getQuerySynonyms: getQuerySynonyms,
    addNcmAlias: addNcmAlias,
    preprocessProductDescription: preprocessProductDescription,
    getChapterHint: getChapterHint,
    verificarNCMComProduto: verificarNCMComProduto,
    filtrarResultadosPorProduto: filtrarResultadosPorProduto,
    getTokensForProduct: getTokensForProduct,
    getExpandedTokensForProduct: getExpandedTokensForProduct,
    hasTokenOverlap: hasTokenOverlap,
    isReady: function () {
      ensureIndex();
      return INDEX.length > 0;
    },
    getValidacaoConfig: function () { return Object.assign({}, VALIDACAO); },
    setValidacaoConfig: function (nivel, cfg) {
      if (VALIDACAO[nivel] && cfg) {
        if (typeof cfg.minScore === 'number') VALIDACAO[nivel].minScore = cfg.minScore;
        if (typeof cfg.minHits === 'number') VALIDACAO[nivel].minHits = cfg.minHits;
        if (typeof cfg.minExactHits === 'number') VALIDACAO[nivel].minExactHits = cfg.minExactHits;
        if (typeof cfg.minTokenCoverage === 'number') VALIDACAO[nivel].minTokenCoverage = cfg.minTokenCoverage;
        if (typeof cfg.rejeitarGenericOnly === 'boolean') VALIDACAO[nivel].rejeitarGenericOnly = cfg.rejeitarGenericOnly;
        if (typeof cfg.genericOnlyMinScore === 'number') VALIDACAO[nivel].genericOnlyMinScore = cfg.genericOnlyMinScore;
        if (typeof cfg.rejeitarDescGenerica === 'boolean') VALIDACAO[nivel].rejeitarDescGenerica = cfg.rejeitarDescGenerica;
        if (typeof cfg.requireStrongMatch === 'boolean') VALIDACAO[nivel].requireStrongMatch = cfg.requireStrongMatch;
        if (typeof cfg.rejeitarIncoerenteCapitulo === 'boolean' && nivel === 'grupo') VALIDACAO[nivel].rejeitarIncoerenteCapitulo = cfg.rejeitarIncoerenteCapitulo;
      }
    }
  };
})();
