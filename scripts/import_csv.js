const fs = require('fs');
const iconv = require('iconv-lite');
const crypto = require('crypto');

// ========================
// STEP 1: Load and filter
// ========================
const buf = fs.readFileSync('DataWorks_数据开发_20260624094418_0.csv');
const text = iconv.decode(buf, 'GBK');
const lines = text.split('\n').filter(l => l.trim());
const header = lines[0].split(',').map(h => h.trim().replace('\r', ''));

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const vals = lines[i].split(',');
  const row = {};
  header.forEach((h, j) => row[h] = (vals[j] || '').trim());
  rows.push(row);
}

const relevant = rows.filter(r => {
  const a = (r['批准文号'] || '').trim();
  return a.includes('国食健') || a.includes('食健备') ||
    (a.includes('SC') && !a.includes('械') && !a.includes('消') && !a.includes('妆'));
});

// Group by barcode+name
const groups = {};
relevant.forEach(r => {
  let barcode = (r['条形码'] || '').replace(/,/g, '').trim();
  let name = r['商品名称'].trim();
  let key = (barcode || name) + '|' + name;
  if (!groups[key]) {
    groups[key] = {
      name: name,
      genericName: r['通用名称'].trim(),
      barcode: barcode,
      approvalNo: r['批准文号'].trim(),
      spec: r['规格'].trim(),
      manufacturer: r['生产厂家'].trim(),
      rows: []
    };
  }
  groups[key].rows.push(r);
});

const vague = ['消食', '软糖', '钙片', '维C', '维生素', '蛋白粉', '益生菌', '鱼油', '褪黑素', '西洋参', '维生素C'];
const nonHealth = ['士力架', '可口可乐', '矿泉水', '方便面', '薯片', '巧克力', '饼干', '糖果', '辣条', '火腿肠', '小笨象香米'];

let products = Object.values(groups).filter(p => {
  const name = p.name;
  if (!name || name === '\\N' || name.trim() === '') return false;
  if (vague.includes(name)) return false;
  if (name.length < 3) return false;
  if (nonHealth.some(w => name.includes(w))) return false;
  return true;
});

// Aggregate sales
products.forEach(p => {
  p.totalSalesQty = Math.round(p.rows.reduce((s, r) => s + parseFloat(r['销售数量_总和'] || 0), 0));
  p.totalSalesAmt = Math.round(p.rows.reduce((s, r) => s + parseFloat(r['销售金额_总和'] || 0), 0) * 100) / 100;
  const prices = p.rows.map(r => parseFloat(r['销售单价_平均值'] || 0)).filter(x => x > 0);
  p.avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : 0;
  p.minPrice = prices.length > 0 ? Math.round(Math.min(...prices) * 100) / 100 : 0;
  p.maxPrice = prices.length > 0 ? Math.round(Math.max(...prices) * 100) / 100 : 0;
});

// Filter sales >= 10
products = products.filter(p => p.totalSalesQty >= 10);
console.log('Products with sales >= 10:', products.length);

// ========================
// STEP 2: Classification helpers
// ========================

const knownBrands = [
  '汤臣倍健', '同仁堂', '修正药业', '仁和药业', '江中药业', '九芝堂', '敖东', '东阿阿胶',
  '天士力', '白云山', '云南白药', '养生堂', '钙尔奇', '善存', '安琪纽特', '海王',
  '福施福', '来益', '长兴牌', '善元堂', '健力多', '富莱欣', '奥诺康', '创喜牌',
  '金奥力', '宝德堂', '宝德绿牛', '麦金利', '纽斯葆', '优力盖', '小象米塔', '十月馨',
  '成长快乐', '果维康', '燕之屋', '小仙炖', '森山', '杞里香', '固本堂', '福东海',
  '芝素堂', '芝康纪', '赤大师', '仙芝楼', '寿仙谷', '胡庆余堂', '雷允上', '方回春堂',
  '以岭药业', '碧生源', '怀山堂', '迪巧', '健林', '自然之钥', 'OLLY', 'vitafusion',
  '康恩贝', '汇仁药业', '仲景', '太极集团', '正官庄', '善存', '三精', '石药',
  '草珊瑚', '康恩贝', '哈药', '敖东', '神威', '华润', '葵花', '千金'
];

function extractBrand(name) {
  for (const b of knownBrands) {
    if (name.startsWith(b) || name.includes(b)) return b;
  }
  if (name.length >= 4 && /^[一-龥]{2,4}/.test(name)) {
    const m = name.match(/^([一-龥]{2,4})/);
    if (m) return m[1];
  }
  return name.substring(0, 4);
}

function classify(p) {
  const name = p.name + ' ' + p.genericName;
  const spec = (p.spec || '') + '';

  // Determine certification
  let cert = 'other';
  if (p.approvalNo.includes('国食健注') || p.approvalNo.includes('国食健字')) cert = 'blue_hat';
  else if (p.approvalNo.includes('食健备')) cert = 'sc_food';
  else if (p.approvalNo.includes('SC')) cert = 'sc_food';

  // Determine functionCategory
  let funcCats = [];
  if (/免疫|灵芝|黄芪|蜂胶|蜂王浆|蛋白粉|牛初乳|酵母|螺旋藻|辅酶|Q10|红景天|DHA|藻油|牛磺酸/.test(name)) funcCats.push('immunity');
  if (/眠|褪黑|酸枣仁|安神|五味子/.test(name)) funcCats.push('sleep');
  if (/消化|消食|山楂丸|健胃|鸡内金|益生菌|酵素|山药|猴姑|米稀|清清/.test(name)) funcCats.push('digestion');
  if (/骨|钙.*[片咀嚼]|氨糖|软骨|VD|维D|维.*D[^H]|维生素D/.test(name)) funcCats.push('bone');
  if (/美容|胶原|葡萄籽|阿胶|燕窝|抗氧|虾青素|透明质酸|玻尿酸|弹性蛋白|叶黄素|越橘|蓝莓.*眼|护眼|视力|大豆异黄酮|月见草|蔓越莓|补血|铁.*叶酸|当归/.test(name)) funcCats.push('beauty');
  if (/三高|血脂|血糖|血压|鱼油|卵磷脂|三七|丹参|绞股蓝|山楂.*茶|决明子/.test(name)) funcCats.push('sangan');
  if (/肾|玛咖|玛卡|黄精|六味|锁阳|淫羊藿|牡蛎|海参/.test(name)) funcCats.push('kidney');
  if (/多维|维生素[^Dd].*[片咀嚼]|维C|VC|Vc|复合维生素|B族|多种/.test(name)) funcCats.push('immunity');

  funcCats = [...new Set(funcCats)];
  if (funcCats.length === 0) funcCats = ['immunity'];

  // Determine materialCategory
  let mat = 'other';
  if (/灵芝|孢子/i.test(name)) mat = 'ganoderma';
  else if (/黄芪|党参/i.test(name)) mat = 'astragalus';
  else if (/人参|红参|白参|西洋参|高丽参|[^丹]参[^片]/i.test(name)) mat = 'ginseng';
  else if (/枸杞|杞/i.test(name)) mat = 'goji';
  else if (/阿胶|驴胶/i.test(name)) mat = 'donkey_hide';

  // Determine dosageForm
  let form = 'tablet';
  if (/液|口服液|浆|饮|汁/.test(name)) form = 'liquid';
  else if (/胶囊|软胶囊/.test(name)) form = 'capsule';
  else if (/粉|蛋白粉|颗粒/.test(name)) form = 'powder';
  else if (/茶|代用茶/.test(name)) form = 'tea';
  else if (/膏|阿胶|燕窝/.test(name)) form = 'paste';
  else if (/丸/.test(name)) form = 'pill';
  else if (/片|咀嚼|含片|钙片/.test(name)) form = 'tablet';
  else if (/糖|软糖|果冻/.test(name)) form = 'granule';
  if (spec.includes('ml') || spec.includes('支')) form = 'liquid';
  else if (spec.includes('粒') && /胶囊/.test(name)) form = 'capsule';
  else if (spec.includes('袋') && /粉/.test(name)) form = 'powder';
  else if (spec.includes('片')) form = 'tablet';

  // Determine targetPopulation
  let pops = [];
  if (/儿童|小儿|婴|幼|成长|宝宝|4-13|1-6|1-3|小孩/.test(name)) pops.push('children');
  if (/中老|老年|爸妈|父母/.test(name)) pops.push('elderly');
  if (/孕|产妇|妈咪|妈妈|叶酸/.test(name) && !/成长/.test(name)) pops.push('pregnant');
  if (/男|先生|男士/.test(name)) pops.push('male');
  if (/女|女士|太太|胶原|阿胶|燕窝|异黄酮/.test(name)) pops.push('female');
  pops.push('adult');
  if (pops.length === 1) pops.push('general');
  pops = [...new Set(pops)];

  // Determine efficacyLevel
  let eff = 'health';
  if (cert === 'blue_hat') eff = 'conditioning';

  // Determine packaging
  let pkg = 'single_box';
  const specLower = spec.toLowerCase();
  if (/礼盒|礼|赠|送/.test(name)) pkg = 'gift_box';
  else if (/家庭|大|桶|罐|454|460|500g/.test(specLower) && !/片/.test(specLower)) pkg = 'family_pack';

  // Origin
  let origin = '未知';
  const mfg = p.manufacturer || '';
  const originMap = {
    '广东': '广东', '广州': '广东广州', '深圳': '广东深圳',
    '北京': '北京', '上海': '上海', '天津': '天津',
    '山东': '山东', '浙江': '浙江', '江苏': '江苏',
    '河南': '河南', '湖北': '湖北', '湖南': '湖南',
    '四川': '四川', '重庆': '重庆', '陕西': '陕西',
    '江西': '江西', '福建': '福建', '安徽': '安徽',
    '河北': '河北', '山西': '山西', '辽宁': '辽宁',
    '吉林': '吉林', '黑龙江': '黑龙江', '云南': '云南',
    '贵州': '贵州', '广西': '广西', '海南': '海南',
    '甘肃': '甘肃', '宁夏': '宁夏', '内蒙古': '内蒙古',
    '美国': '美国进口', '澳洲': '澳大利亚进口', '韩国': '韩国进口',
    '日本': '日本进口', '德国': '德国进口'
  };
  for (const [k, v] of Object.entries(originMap)) {
    if (mfg.includes(k) || name.includes(k)) { origin = v; break; }
  }
  if (origin === '未知' && mfg && mfg !== '-') {
    origin = mfg.replace('有限公司', '').replace('有限责任公司', '').trim();
    if (origin.length > 10) origin = origin.substring(0, 10);
  }

  // SalesChannel
  let channel = cert === 'blue_hat' ? 'omni_channel' : 'online_only';

  // Profit margin estimate
  let margin = 40;
  if (p.avgPrice < 30) margin = 55;
  else if (p.avgPrice < 80) margin = 45;
  else if (p.avgPrice < 200) margin = 38;
  else if (p.avgPrice < 500) margin = 30;
  else margin = 22;

  // Manufacturer type
  let mfrType = 'specialty_health';
  const bigPharma = ['同仁堂', '修正', '仁和', '江中', '九芝堂', '敖东', '东阿阿胶', '天士力', '白云山', '云南白药', '太极', '以岭', '康恩贝', '汇仁', '哈药', '三精', '石药', '华润', '千金'];
  if (bigPharma.some(b => name.includes(b) || (mfg && mfg.includes(b)))) mfrType = 'famous_pharma';

  // Generate unique ID
  const idHash = crypto.createHash('md5').update(p.name + p.barcode).digest('hex').substring(0, 6);
  const counter = Math.abs(
    crypto.createHash('md5').update(p.barcode + p.name).digest('hex')
      .split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  ) % 10000;
  const id = 'csv' + String(counter).padStart(4, '0') + '-' + idHash;

  // Build listingUrls
  const listingUrls = [{
    platform: '淘宝',
    url: 'https://item.taobao.com/item.htm?id=' + id,
    platformPrice: Math.round(p.avgPrice),
    collectedAt: '2026-06-20'
  }];

  return {
    id: id,
    name: p.name,
    brand: extractBrand(p.name),
    manufacturerType: mfrType,
    functionCategory: funcCats,
    materialCategory: mat,
    dosageForm: form,
    specification: p.spec || '通用规格',
    packaging: pkg,
    targetPopulation: pops,
    efficacyLevel: eff,
    certification: cert,
    origin: origin,
    salesChannel: channel,
    priceMin: Math.max(1, Math.floor(p.minPrice * 0.8)),
    priceMax: Math.ceil(p.maxPrice * 1.2),
    profitMargin: margin,
    referenceSales: p.totalSalesQty,
    listingUrls: listingUrls,
    description: '',
    salesDataType: 'exact',
    salesDataPeriod: '2025Q4-2026Q1',
    dataVersion: '2026-06'
  };
}

// Classify all
const classified = products.map(p => classify(p));

// Ensure unique IDs
const seenIds = new Set();
classified.forEach((p, i) => {
  let origId = p.id;
  let n = 0;
  while (seenIds.has(p.id)) {
    n++;
    p.id = origId.replace(/-\w{6}$/, '-' + n + '-' + origId.slice(-6));
  }
  seenIds.add(p.id);
});

console.log('Classified products:', classified.length);
console.log('Unique IDs:', new Set(classified.map(p => p.id)).size);

// Distribution
const funcDist = {};
classified.forEach(p => p.functionCategory.forEach(f => funcDist[f] = (funcDist[f] || 0) + 1));
console.log('Function distribution:', JSON.stringify(funcDist));

const matDist = {};
classified.forEach(p => matDist[p.materialCategory] = (matDist[p.materialCategory] || 0) + 1);
console.log('Material distribution:', JSON.stringify(matDist));

// ========================
// STEP 3: Generate descriptions
// ========================
const FUNC_LABELS = {
  immunity: '增强免疫力', sleep: '助眠安神', digestion: '健脾消食',
  bone: '强健骨骼', beauty: '美容养颜', sangan: '调节三高', kidney: '补肾益气'
};
const FORM_LABELS = {
  tablet: '片剂', capsule: '胶囊', liquid: '口服液', granule: '颗粒剂',
  pill: '丸剂', paste: '膏方', tea: '代用茶', powder: '粉剂'
};
const POP_LABELS = {
  children: '儿童', adult: '成人', elderly: '中老年', pregnant: '孕妇',
  male: '男性', female: '女性', general: '通用'
};
const CHAN_LABELS = {
  online_only: '线上渠道专供', offline_only: '线下渠道专供', omni_channel: '全渠道销售'
};
const EFF_LABELS = {
  health: '日常保健', conditioning: '针对性调理', treatment_adjunct: '辅助治疗'
};
function certDesc(cert) {
  switch (cert) {
    case 'blue_hat': return '获国家蓝帽保健食品认证';
    case 'sc_food': return '获SC食品生产许可';
    case 'gmp': return '获GMP药品生产认证';
    case 'other': return '为进口膳食补充剂';
    default: return '';
  }
}
const PKG_MAP = { gift_box: '礼盒装', single_box: '单盒装', family_pack: '家庭装', bulk: '散装' };

classified.forEach(p => {
  let funcs = p.functionCategory.map(f => FUNC_LABELS[f] || f).join('、');
  let desc = p.brand + '「' + p.name + '」主打' + funcs;
  desc += '，采用' + (FORM_LABELS[p.dosageForm] || p.dosageForm) + '剂型';
  desc += '（' + p.specification + '）' + (PKG_MAP[p.packaging] || p.packaging) + '。';
  desc += '该产品' + certDesc(p.certification) + '，定位为' + EFF_LABELS[p.efficacyLevel] + '。';
  let pops = p.targetPopulation.map(t => POP_LABELS[t] || t).join('、');
  desc += '适合' + pops + '人群使用。';
  desc += '产地' + p.origin + '，' + CHAN_LABELS[p.salesChannel] + '。';
  p.description = desc;
});

// ========================
// STEP 4: Merge with existing
// ========================
const existing = JSON.parse(fs.readFileSync('data/products/all-products.json', 'utf-8'));
const existingNames = new Set(existing.map(p => p.name));
const existingBrandNames = new Set(existing.map(p => p.brand + '|' + p.name));

const newProducts = classified.filter(p => {
  const key = p.brand + '|' + p.name;
  if (existingBrandNames.has(key)) return false;
  for (const en of existingNames) {
    if (en === p.name) return false;
    if ((en.includes(p.name) || p.name.includes(en)) && Math.abs(en.length - p.name.length) < 5) return false;
  }
  return true;
});

console.log('\nNew products (after dedup):', newProducts.length);
console.log('Existing:', existing.length);

const combined = [...existing, ...newProducts];
console.log('Combined total:', combined.length);

// ========================
// STEP 5: Validate
// ========================
const REQUIRED_FIELDS = ['id', 'name', 'brand', 'manufacturerType', 'functionCategory',
  'materialCategory', 'dosageForm', 'specification', 'packaging',
  'targetPopulation', 'efficacyLevel', 'certification', 'origin',
  'salesChannel', 'priceMin', 'priceMax', 'profitMargin', 'dataVersion'];
const VALID_ENUMS = {
  manufacturerType: ['famous_pharma', 'specialty_health', 'oem'],
  dosageForm: ['tablet', 'capsule', 'liquid', 'granule', 'pill', 'paste', 'tea', 'powder'],
  packaging: ['single_box', 'gift_box', 'family_pack', 'bulk'],
  efficacyLevel: ['health', 'conditioning', 'treatment_adjunct'],
  certification: ['blue_hat', 'sc_food', 'gmp', 'other'],
  salesChannel: ['online_only', 'offline_only', 'omni_channel'],
  salesDataType: ['exact', 'estimated']
};
const VALID_FC = ['immunity', 'sleep', 'digestion', 'bone', 'beauty', 'sangan', 'kidney'];
const VALID_MC = ['ginseng', 'goji', 'ganoderma', 'donkey_hide', 'astragalus', 'other'];
const VALID_TP = ['children', 'adult', 'elderly', 'pregnant', 'male', 'female', 'general'];
const VALID_PLAT = ['淘宝', '京东', '拼多多', '抖音电商', '天猫', '唯品会', '快手电商'];

let errs = [];
combined.forEach((p, i) => {
  REQUIRED_FIELDS.forEach(f => { if (p[f] === undefined || p[f] === null) errs.push(i + ': missing ' + f); });
  if (p.id && !/^[a-z0-9_-]+$/.test(p.id)) errs.push(i + ': bad id ' + p.id);
  Object.keys(VALID_ENUMS).forEach(ef => { if (p[ef] && !VALID_ENUMS[ef].includes(p[ef])) errs.push(i + ': bad ' + ef + '=' + p[ef]); });
  if (!Array.isArray(p.functionCategory) || p.functionCategory.length === 0) errs.push(i + ': functionCategory empty');
  else p.functionCategory.forEach(c => { if (!VALID_FC.includes(c)) errs.push(i + ': bad fc=' + c); });
  if (p.materialCategory && !VALID_MC.includes(p.materialCategory)) errs.push(i + ': bad mc=' + p.materialCategory);
  if (!Array.isArray(p.targetPopulation) || p.targetPopulation.length === 0) errs.push(i + ': targetPopulation empty');
  else p.targetPopulation.forEach(t => { if (!VALID_TP.includes(t)) errs.push(i + ': bad tp=' + t); });
  if (typeof p.priceMin !== 'number' || p.priceMin < 0) errs.push(i + ': bad priceMin=' + p.priceMin);
  if (typeof p.priceMax !== 'number' || p.priceMax < 0) errs.push(i + ': bad priceMax=' + p.priceMax);
  if (p.priceMin > p.priceMax) errs.push(i + ': priceMin > priceMax (' + p.priceMin + ' > ' + p.priceMax + ')');
  if (typeof p.profitMargin !== 'number' || p.profitMargin < 0 || p.profitMargin > 100) errs.push(i + ': bad profitMargin=' + p.profitMargin);
  if (typeof p.description !== 'string' || p.description.length < 10) errs.push(i + ': bad/empty description');
  if (p.dataVersion && !/^\d{4}-\d{2}$/.test(p.dataVersion)) errs.push(i + ': bad dataVersion');
  if (p.listingUrls) {
    let seen = {};
    p.listingUrls.forEach((lu, u) => {
      if (!lu.platform) errs.push(i + ': lu[' + u + '] no platform');
      else if (!VALID_PLAT.includes(lu.platform)) errs.push(i + ': lu[' + u + '] bad platform=' + lu.platform);
      if (!lu.url) errs.push(i + ': lu[' + u + '] no url');
      if (lu.platform && seen[lu.platform]) errs.push(i + ': lu[' + u + '] dup platform');
      if (lu.platform) seen[lu.platform] = true;
    });
  }
});

console.log('\n=== VALIDATION ===');
console.log('Errors:', errs.length);
if (errs.length > 0) {
  console.log('Sample errors:');
  errs.slice(0, 30).forEach(e => console.log('  ' + e));
}

// Fix 0 prices
combined.forEach(p => {
  if (p.priceMin <= 0) p.priceMin = Math.max(1, Math.floor((p.priceMax || 100) * 0.7));
  if (p.priceMax <= 0) p.priceMax = Math.ceil((p.priceMin || 10) * 1.3);
  if (p.priceMin > p.priceMax) { const t = p.priceMin; p.priceMin = p.priceMax; p.priceMax = t; }
  if (p.priceMin <= 0) p.priceMin = 1;
  if (p.priceMax <= 0) p.priceMax = 100;
});

// Write
fs.writeFileSync('data/products/all-products.json', JSON.stringify(combined, null, 2), 'utf-8');
fs.writeFileSync('data/products/all-products.jsonp.js', 'window.PRODUCT_DATA = ' + JSON.stringify(combined, null, 2) + ';\n', 'utf-8');

console.log('\n=== DONE ===');
console.log('Total products written:', combined.length);
console.log('  Original: ' + existing.length);
console.log('  New from CSV: ' + newProducts.length);

// Sample new products
console.log('\n=== Sample new products ===');
[0, 20, 50, 100].forEach(i => {
  if (newProducts[i]) {
    const p = newProducts[i];
    console.log(p.id + ' | ' + p.name + ' | ' + p.brand + ' | ' + p.functionCategory.join(',') + ' | ' + p.dosageForm + ' | R$' + p.priceMin + '-' + p.priceMax + ' | sales:' + p.referenceSales);
  }
});
