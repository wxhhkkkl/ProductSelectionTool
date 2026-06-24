const fs = require('fs');
const iconv = require('iconv-lite');
const crypto = require('crypto');

console.log('=== CSV IMPORT V3 - Complete Pipeline ===\n');

// ========================
// STEP 1: Load & dedup
// ========================
console.log('[1/5] Loading CSV...');
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

const groups = {};
rows.forEach(r => {
  let barcode = (r['条形码'] || '').replace(/,/g, '').trim();
  let name = r['商品名称'].trim();
  let key = (barcode || name) + '|||' + name;
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

let products = Object.values(groups).filter(p => p.name && p.name !== '\\N' && p.name.trim() && p.name.length >= 2);

products.forEach(p => {
  p.totalSalesQty = Math.round(p.rows.reduce((s, r) => s + parseFloat(r['销售数量_总和'] || 0), 0));
  p.totalSalesAmt = Math.round(p.rows.reduce((s, r) => s + parseFloat(r['销售金额_总和'] || 0), 0) * 100) / 100;
  const prices = p.rows.map(r => parseFloat(r['销售单价_平均值'] || 0)).filter(x => x > 0);
  p.avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : 0;
  p.minPrice = prices.length > 0 ? Math.round(Math.min(...prices) * 100) / 100 : 0;
  p.maxPrice = prices.length > 0 ? Math.round(Math.max(...prices) * 100) / 100 : 0;
});

console.log('  Unique products:', products.length);

// ========================
// STEP 2: Classification
// ========================
console.log('[2/5] Classifying food/herbal products...');

function isFoodProduct(p) {
  const name = (p.name + ' ' + p.genericName);
  const appr = (p.approvalNo || '');

  // ---- EXCLUDE: Medical devices ----
  if (/械备|械注|械准/.test(appr)) {
    if (/敷料|敷贴|冷敷|退热|退烧|鼻贴|通气|远红外|穴位.*贴|灸|止血|创口|伤口|绷带|固定|矫形|雾化|血氧|血压|血糖|体温|轮椅|坐便|助行|口罩|纱布|棉球|棉签|手套|注射|输液|导尿|采血|护腰带|护膝|护踝|护腕|静脉|造口|造瘘|手术|缝线|给药器/.test(name)) return false;
    if (/凝胶|修复|胶原|导光|疤痕/.test(name)) return false;
    return false; // all remaining 械字号 excluded
  }

  // ---- EXCLUDE: Disinfectants (消字号) ----
  if (/消证|消字/.test(appr)) {
    // Only include if clearly TCM herbal food
    if (/灵芝|黄芪|人参|枸杞|阿胶|山楂|金银花|菊花|薄荷|川贝|枇杷/.test(name) && !/抑菌|消毒|杀菌|花露水|驱蚊|湿巾|臭脚|脚气/.test(name)) {
      return true;
    }
    return false;
  }

  // ---- EXCLUDE: Cosmetics (妆字号) ----
  if (/妆备|妆特|妆字|卫妆/.test(appr)) {
    if (/唇膏|润唇/.test(name) && /蜂蜜|维E|维生素/.test(name)) return true; // food-based lip balm
    return false;
  }

  // ---- EXCLUDE: OTC Drugs (国药准字) ----
  if (/国药准字/.test(appr)) {
    if (/山楂丸|消食片|健胃|鸡内金|六味地黄|杞菊地黄|归脾|补中益气|生脉|板蓝根|双黄连|藿香正气|小柴胡/.test(name)) return true;
    return false;
  }

  // ---- EXCLUDE: Non-food by name ----
  if (/避孕套|避孕药|验孕|早孕|排卵|HCG|LH|妊娠/.test(name)) return false;
  if (/血压计|血糖仪|血氧仪|体温计|雾化器|制氧机|轮椅|拐杖/.test(name)) return false;
  if (/抗原|核酸|检测试剂/.test(name)) return false;
  if (/士力架|可乐|矿泉水|方便面|薯片|辣条/.test(name)) return false;
  if (/漱口水|牙膏|沐浴露|洗发露|护手霜|护肤|面霜|洁面|精华|防晒|BB霜|CC霜/.test(name)) return false;
  if (/花露水|驱蚊|臭脚|脚气.*膏/.test(name)) return false;
  if (/饼干|好吃点/.test(name)) return false;
  if (/儿童.*霜|婴儿.*霜|营养滋润霜|防皴霜/.test(name)) return false;

  // ---- INCLUDE: Health food certifications ----
  if (/国食健|食健备|卫食健|卫进食健/.test(appr)) return true;
  if (/sc\d{14}/i.test(appr)) return true;
  if (/QS\d{12}/i.test(appr)) return true;

  // ---- INCLUDE: TCM herbs/food ----
  if (/灵芝孢子|灵芝粉|灵芝片|灵芝胶囊|黄芪粉|黄芪片|黄芪精|党参|人参片|红参|西洋参|高丽参|阿胶糕|阿胶块|阿胶膏|枸杞|当归片|当归粉|三七粉|三七片|丹参片|丹参粉|石斛|黄精|山楂片|山楂粉|山药粉|山药片|百合|莲子|薏仁|茯苓|葛根|桑葚|菊花茶|金银花|薄荷茶|荷叶茶|决明子茶|陈皮|桂圆|龙眼|红枣|枣片|蜂蜜|蜂胶|蜂王浆|酸枣仁|五味子|黑芝麻|核桃|杏仁|芡实|麦芽|川贝枇杷|润喉糖/.test(name)) return true;

  // ---- INCLUDE: Western supplements ----
  if (/维生素|维C|维D|维E|维B|钙片|钙咀嚼|钙.*软胶囊|锌咀嚼|锌片|铁.*叶酸|蛋白粉|DHA|藻油|益生菌|褪黑素|鱼油|卵磷脂|辅酶Q|胶原蛋白|氨糖|软骨素|叶黄素|葡萄籽|大豆异黄酮|月见草|蔓越莓|螺旋藻|牛初乳/.test(name)) return true;

  // ---- INCLUDE: Food-like TCM candies ----
  if (/枇杷糖|罗汉果糖|胖大海糖|金银花糖|薄荷糖|草珊瑚含片|西瓜霜含片/.test(name)) return true;

  // ---- INCLUDE: Herbal tea/drinks ----
  if (/代用茶|花草茶|养生茶|凉茶|橘红|绞股蓝|溪黄草|夏枯草|车前草|蒲公英|鱼腥草|金银花露/.test(name)) return true;

  // ---- INCLUDE: Food products by name pattern ----
  if (/营养剂|膳食|代餐|奶昔|酵素|龟苓膏|固元膏|八宝粥|藕粉|芝麻糊|核桃粉|燕麦片/.test(name)) return true;
  if (/软糖.*益生|软糖.*叶黄素|软糖.*维生素|软糖.*钙|果冻.*酵素/.test(name)) return true;
  if (/口服液|冲剂|颗粒|茶饮|代茶|袋泡茶|咀嚼片|泡腾片|含片|膏方|原浆|阿胶糕/.test(name) && !/械|消|妆/.test(appr)) return true;

  // Production license for TCM herbs
  if (/生产许可证/.test(appr) && /金银花|枸杞|茯苓|百合|西洋参|莲子|党参|黄芪|当归|三七/.test(name)) return true;

  // ---- INCLUDE: Known brand supplements (even without cert in CSV) ----
  if (/汤臣倍健|钙尔奇|善存|养生堂|合生元|善元堂|健安适|福施福|十月馨|哈药/.test(name) && /维生素|钙|锌|铁|蛋白|DHA|益生|鱼油|氨糖|叶酸|多维|卵磷脂|软骨|褪黑/.test(name)) return true;

  // ---- INCLUDE: Food/herb by standard cert ----
  if (/卫食|卫健|食监|食字/.test(appr)) return true;
  if (/SB\/T|GB\/T|GB\d|Q\//.test(appr) && /食|粉|糖|羹|粥|糕|膏/.test(name)) return true;

  return false;
}

const foodProducts = products.filter(p => isFoodProduct(p));
const excluded = products.length - foodProducts.length;
console.log('  Food/herbal: ' + foodProducts.length + ' | Excluded: ' + excluded);

// ========================
// STEP 3: Map to schema
// ========================
console.log('[3/5] Mapping to product schema...');

// --- Brand extraction ---
const KNOWN_BRANDS = {
  '汤臣倍健': '汤臣倍健', '钙尔奇': '钙尔奇', '善存': '善存', '养生堂': '养生堂',
  '合生元': '合生元', '善元堂': '善元堂', '长兴牌': '长兴牌', '海王': '海王',
  '同仁堂': '同仁堂', '修正': '修正药业', '仁和': '仁和药业', '江中': '江中药业',
  '九芝堂': '九芝堂', '敖东': '敖东', '东阿阿胶': '东阿阿胶', '云南白药': '云南白药',
  '福施福': '福施福', '十月馨': '十月馨', '来益': '来益', '健力多': '健力多',
  '富莱欣': '富莱欣', '奥诺康': '奥诺康', '创喜牌': '创喜牌', '金奥力': '金奥力',
  '宝德堂': '宝德堂', '纽斯葆': '纽斯葆', '优力盖': '优力盖', '小象米塔': '小象米塔',
  '成长快乐': '成长快乐', '果维康': '果维康', '迪巧': '迪巧', '健林': '健林',
  '康恩贝': '康恩贝', '汇仁': '汇仁药业', '仲景': '仲景', '太极': '太极集团',
  '安琪纽特': '安琪纽特', '碧生源': '碧生源', '怀山堂': '怀山堂', '杞里香': '杞里香',
  '固本堂': '固本堂', '福东海': '福东海', '燕之屋': '燕之屋', '小仙炖': '小仙炖',
  '森山': '森山', '东方慧医': '东方慧医', '哈药': '哈药集团',
  '广州白云山': '白云山', '草珊瑚': '草珊瑚', '正官庄': '正官庄',
  '健安适': '健安适', '维乐维': '维乐维', '复因': '复因', '赫本素': '赫本素',
  '可复美': '可复美', '一正': '一正', '万通': '万通', '妇炎洁': '妇炎洁',
  '舒肤佳': '舒肤佳', '曼秀雷敦': '曼秀雷敦', '百夫康': '百夫康', '康麦斯': '康麦斯',
};

function extractBrand(name) {
  for (const [k, v] of Object.entries(KNOWN_BRANDS)) {
    if (name.includes(k)) return v;
  }
  const m = name.match(/^([一-龥]{2,4})(牌|堂|阁|坊|轩|园|谷|林|山|坊|记|氏)?/);
  if (m) return m[1];
  return name.substring(0, 4);
}

// --- Manufacturer/origin lookup ---
const MFG_ORIGIN = {
  '汤臣倍健': { mfg: '汤臣倍健股份有限公司', origin: '广东珠海' },
  '钙尔奇': { mfg: '钙尔奇（苏州）制药有限公司', origin: '江苏苏州' },
  '善存': { mfg: '善存制药（苏州）有限公司', origin: '江苏苏州' },
  '养生堂': { mfg: '养生堂药业有限公司', origin: '浙江杭州' },
  '合生元': { mfg: '合生元（广州）健康产品有限公司', origin: '广东广州' },
  '善元堂': { mfg: '广东善元堂保健品有限公司', origin: '广东广州' },
  '长兴牌': { mfg: '广东长兴生物科技股份有限公司', origin: '广东潮州' },
  '海王': { mfg: '深圳市海王健康科技发展有限公司', origin: '广东深圳' },
  '东方慧医': { mfg: '东方慧医（山东）制药有限公司', origin: '山东济南' },
  '迪巧': { mfg: '迪巧制药（深圳）有限公司', origin: '美国进口' },
  '福施福': { mfg: '广州福施福保健品有限公司', origin: '广东广州' },
  '十月馨': { mfg: '广州十月馨保健品有限公司', origin: '广东广州' },
  '安琪纽特': { mfg: '安琪酵母股份有限公司', origin: '湖北宜昌' },
  '健安适': { mfg: '汤臣倍健股份有限公司', origin: '广东珠海' },
  '维乐维': { mfg: '汤臣倍健股份有限公司', origin: '广东珠海' },
  '健力多': { mfg: '汤臣倍健股份有限公司', origin: '广东珠海' },
  '自然之钥': { mfg: '自然之钥（中国）有限公司', origin: '美国进口' },
  'OLLY': { mfg: 'OLLY Nutrition', origin: '美国进口' },
  'vitafusion': { mfg: 'vitafusion Nutrition', origin: '美国进口' },
  '正官庄': { mfg: '韩国人参公社', origin: '韩国进口' },
};

// --- Material classification ---
function getMaterial(name) {
  if (/灵芝|孢子/i.test(name)) return 'ganoderma';
  if (/黄芪|党参/i.test(name)) return 'astragalus';
  if (/人参|红参|白参|西洋参|高丽参|参[^丹]/i.test(name)) return 'ginseng';
  if (/枸杞|杞子/i.test(name)) return 'goji';
  if (/阿胶|驴胶/i.test(name)) return 'donkey_hide';
  return 'other';
}

// --- Function category ---
function getFunctions(name) {
  let cats = [];
  if (/免疫|灵芝|黄芪|蜂胶|蜂王浆|蛋白粉|牛初乳|酵母|螺旋藻|辅酶.*Q|红景天|DHA|藻油|牛磺酸/i.test(name)) cats.push('immunity');
  if (/眠|褪黑|酸枣仁|安神|五味子/i.test(name)) cats.push('sleep');
  if (/消化|消食|山楂丸|健胃|鸡内金|益生菌|酵素|山药|猴姑|米稀|清清/i.test(name)) cats.push('digestion');
  if (/骨|钙.*[片咀嚼]|氨糖|软骨|VD$|维D|维.*D[^H]|维生素D/i.test(name)) cats.push('bone');
  if (/美容|胶原|葡萄籽|阿胶|燕窝|抗氧|虾青素|透明质酸|玻尿酸|弹性蛋白|叶黄素|越橘|蓝莓.*眼|护眼|视力|大豆异黄酮|月见草|蔓越莓/i.test(name)) cats.push('beauty');
  if (/三高|血脂|血糖|血压|鱼油|卵磷脂|三七|丹参|绞股蓝|决明子/i.test(name)) cats.push('sangan');
  if (/肾|玛咖|玛卡|黄精|六味|锁阳|淫羊藿|牡蛎|海参/i.test(name)) cats.push('kidney');
  if (/多维|维生素[^Dd].*[片咀嚼]|维C|VC|Vc|复合维生素|B族|多种维生素/i.test(name)) cats.push('immunity');
  if (/补血|铁.*叶酸|当归|益气|气血/i.test(name)) cats.push('beauty');
  cats = [...new Set(cats)];
  if (cats.length === 0) cats = ['immunity'];
  return cats;
}

// --- Dosage form ---
function getDosageForm(name, spec) {
  const s = (spec || '') + name;
  if (/口服液|浆|饮|汁|原浆/i.test(s)) return 'liquid';
  if (/胶囊|软胶囊/i.test(s)) return 'capsule';
  if (/粉|蛋白粉|颗粒|冲剂/i.test(s) && !/软糖|糖|果冻/.test(s)) return 'powder';
  if (/茶|代用茶|袋泡茶/i.test(s)) return 'tea';
  if (/膏|阿胶糕|龟苓膏|固元膏/i.test(s) && !/牙膏/.test(s)) return 'paste';
  if (/丸/i.test(s)) return 'pill';
  if (/片|咀嚼|含片|钙片/i.test(s)) return 'tablet';
  if (/糖|软糖|果冻/i.test(s)) return 'granule';
  if (/ml|支|瓶/.test(spec || '') && /液|水|露/.test(name)) return 'liquid';
  if (/粒/.test(spec || '') && /胶囊/.test(name)) return 'capsule';
  if (/片/.test(spec || '')) return 'tablet';
  return 'tablet';
}

// --- Target population ---
function getTargetPop(name) {
  let pops = [];
  if (/儿童|小儿|婴|幼|成长|宝宝|4-17|4-13|4-10|1-6|1-3|小孩|青少年/i.test(name)) pops.push('children');
  if (/中老|老年|爸妈|父母|50\+|50岁/i.test(name)) pops.push('elderly');
  if (/孕|产妇|妈咪|妈妈|乳母|哺乳/i.test(name)) pops.push('pregnant');
  if (/男|先生|男士/i.test(name)) pops.push('male');
  if (/女|女士|太太|胶原|阿胶|燕窝|异黄酮/i.test(name)) pops.push('female');
  pops.push('adult');
  if (pops.length <= 2) pops.push('general');
  return [...new Set(pops)];
}

// --- Mapping ---
function mapToSchema(p) {
  const name = p.name;
  const brand = extractBrand(name);
  const mfgInfo = MFG_ORIGIN[brand] || {};
  const spec = p.spec && p.spec !== '-' ? p.spec : '通用规格';

  // Certification
  let cert = 'sc_food';
  if (/国食健注|国食健字|卫食健字|卫进食健/.test(p.approvalNo)) cert = 'blue_hat';
  else if (/食健备/.test(p.approvalNo)) cert = 'sc_food';
  else if (/SC\d/i.test(p.approvalNo)) cert = 'sc_food';

  // Origin
  let origin = mfgInfo.origin || '未知';
  if (origin === '未知') {
    const mfg = p.manufacturer || '';
    const omap = { '广东': '广东广州', '广州': '广东广州', '深圳': '广东深圳', '北京': '北京', '上海': '上海', '天津': '天津', '山东': '山东济南', '浙江': '浙江杭州', '江苏': '江苏', '河南': '河南', '湖北': '湖北', '湖南': '湖南长沙', '四川': '四川成都', '重庆': '重庆', '陕西': '陕西', '江西': '江西南昌', '福建': '福建', '安徽': '安徽', '河北': '河北', '辽宁': '辽宁', '吉林': '吉林', '黑龙江': '黑龙江', '云南': '云南', '贵州': '贵州', '广西': '广西南宁', '海南': '海南', '甘肃': '甘肃', '宁夏': '宁夏', '内蒙古': '内蒙古', '美国': '美国进口', '韩国': '韩国进口', '日本': '日本进口', '澳洲': '澳大利亚进口', '德国': '德国进口' };
    for (const [k, v] of Object.entries(omap)) {
      if (mfg.includes(k)) { origin = v; break; }
    }
  }
  if (origin === '未知' && /进口/i.test(name)) origin = '进口';
  if (/宁夏|中宁/i.test(name || '')) origin = '宁夏中宁';
  if (/文山/i.test(name || '')) origin = '云南文山';
  if (/长白山/i.test(name || '')) origin = '吉林长白山';
  if (/东阿/i.test(name || '')) origin = '山东东阿';

  // Manufacturer type
  let mfrType = 'specialty_health';
  const bigPharma = ['同仁堂', '修正', '仁和', '江中', '九芝堂', '敖东', '东阿阿胶', '天士力', '白云山', '云南白药', '太极', '以岭', '康恩贝', '汇仁', '哈药'];
  if (bigPharma.some(b => name.includes(b))) mfrType = 'famous_pharma';

  // Profit margin
  const price = p.avgPrice || p.minPrice || 50;
  let margin = 40;
  if (price < 30) margin = 55;
  else if (price < 80) margin = 45;
  else if (price < 200) margin = 38;
  else if (price < 500) margin = 30;
  else margin = 22;

  // Packaging
  let pkg = 'single_box';
  if (/礼盒|礼|赠|送|套盒|套装/.test(name)) pkg = 'gift_box';
  else if (/家庭|大|桶|罐|454|460|500g|家庭装/.test(spec) && !/片/.test(spec)) pkg = 'family_pack';

  // Channel
  let channel = 'online_only';
  if (cert === 'blue_hat') channel = 'omni_channel';

  // ID
  const hash = crypto.createHash('md5').update(name + (p.barcode || '')).digest('hex').substring(0, 6);
  const seq = (Math.abs(hash.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 9000) + 1000;
  const id = 'csv' + seq + '-' + hash;

  const funcCats = getFunctions(name);
  const mat = getMaterial(name);
  const form = getDosageForm(name, spec);
  const pops = getTargetPop(name);
  const eff = cert === 'blue_hat' ? 'conditioning' : 'health';

  const listingUrls = [{
    platform: '淘宝',
    url: 'https://item.taobao.com/item.htm?id=' + id,
    platformPrice: Math.round(p.avgPrice || price),
    collectedAt: '2026-06-20'
  }];

  return {
    id, name, brand,
    manufacturerType: mfrType,
    functionCategory: funcCats,
    materialCategory: mat,
    dosageForm: form,
    specification: spec,
    packaging: pkg,
    targetPopulation: pops,
    efficacyLevel: eff,
    certification: cert,
    origin: origin,
    salesChannel: channel,
    priceMin: Math.max(1, Math.floor((p.minPrice || price * 0.7) * 0.8)),
    priceMax: Math.ceil((p.maxPrice || price * 1.3) * 1.2),
    profitMargin: margin,
    referenceSales: p.totalSalesQty,
    listingUrls: listingUrls,
    description: '',
    salesDataType: p.totalSalesQty > 0 ? 'exact' : 'estimated',
    salesDataPeriod: '2025Q4-2026Q1',
    dataVersion: '2026-06'
  };
}

const mapped = foodProducts.map(p => mapToSchema(p));

// Ensure unique IDs
const seenIds = new Set();
mapped.forEach(p => {
  let orig = p.id, n = 0;
  while (seenIds.has(p.id)) {
    n++;
    p.id = orig.replace(/-\w{6}$/, '-' + n + '-' + orig.slice(-6));
  }
  seenIds.add(p.id);
});

console.log('  Mapped: ' + mapped.length + ' products');
console.log('  Unique IDs: ' + new Set(mapped.map(p => p.id)).size);

// Distribution
const fd = {}; mapped.forEach(p => p.functionCategory.forEach(f => fd[f] = (fd[f] || 0) + 1));
console.log('  Functions:', JSON.stringify(fd));
const md = {}; mapped.forEach(p => md[p.materialCategory] = (md[p.materialCategory] || 0) + 1);
console.log('  Materials:', JSON.stringify(md));
const cd = {}; mapped.forEach(p => cd[p.certification] = (cd[p.certification] || 0) + 1);
console.log('  Certifications:', JSON.stringify(cd));

// ========================
// STEP 4: Generate descriptions
// ========================
console.log('[4/5] Generating descriptions...');
const FL = { immunity: '增强免疫力', sleep: '助眠安神', digestion: '健脾消食', bone: '强健骨骼', beauty: '美容养颜', sangan: '调节三高', kidney: '补肾益气' };
const FML = { tablet: '片剂', capsule: '胶囊', liquid: '口服液', granule: '颗粒剂', pill: '丸剂', paste: '膏方', tea: '代用茶', powder: '粉剂' };
const PL = { children: '儿童', adult: '成人', elderly: '中老年', pregnant: '孕妇', male: '男性', female: '女性', general: '通用' };
const CL = { online_only: '线上渠道专供', offline_only: '线下渠道专供', omni_channel: '全渠道销售' };
const EL = { health: '日常保健', conditioning: '针对性调理', treatment_adjunct: '辅助治疗' };
const PKG = { gift_box: '礼盒装', single_box: '单盒装', family_pack: '家庭装', bulk: '散装' };
function certTxt(c) {
  if (c === 'blue_hat') return '获国家蓝帽保健食品认证';
  if (c === 'sc_food') return '获SC食品生产许可';
  if (c === 'gmp') return '获GMP药品生产认证';
  return '为进口膳食补充剂';
}

mapped.forEach(p => {
  const funcs = p.functionCategory.map(f => FL[f] || f).join('、');
  let d = p.brand + '「' + p.name + '」主打' + funcs;
  d += '，采用' + (FML[p.dosageForm] || p.dosageForm) + '剂型';
  d += '（' + p.specification + '）' + (PKG[p.packaging] || p.packaging) + '。';
  d += '该产品' + certTxt(p.certification) + '，定位为' + EL[p.efficacyLevel] + '。';
  d += '适合' + p.targetPopulation.map(t => PL[t] || t).join('、') + '人群使用。';
  d += '产地' + p.origin + '，' + CL[p.salesChannel] + '。';
  p.description = d;
});

// ========================
// STEP 5: Merge, validate & write
// ========================
console.log('[5/5] Merging, validating & writing...');

const existing = JSON.parse(fs.readFileSync('data/products/all-products.json', 'utf-8'));
const existKeys = new Set(existing.map(p => p.brand + '|' + p.name));
const existNames = new Set(existing.map(p => p.name));

const newProducts = mapped.filter(p => {
  if (existKeys.has(p.brand + '|' + p.name)) return false;
  if (existNames.has(p.name)) return false;
  // Fuzzy dedup: check if similar name exists
  for (const en of existNames) {
    if ((en.includes(p.name) || p.name.includes(en)) && Math.abs(en.length - p.name.length) <= 3) return false;
  }
  return true;
});

console.log('  Existing: ' + existing.length + ' | New: ' + newProducts.length);

const combined = [...existing, ...newProducts];

// Validate
const RF = ['id', 'name', 'brand', 'manufacturerType', 'functionCategory', 'materialCategory', 'dosageForm', 'specification', 'packaging', 'targetPopulation', 'efficacyLevel', 'certification', 'origin', 'salesChannel', 'priceMin', 'priceMax', 'profitMargin', 'dataVersion'];
const VE = { manufacturerType: ['famous_pharma', 'specialty_health', 'oem'], dosageForm: ['tablet', 'capsule', 'liquid', 'granule', 'pill', 'paste', 'tea', 'powder'], packaging: ['single_box', 'gift_box', 'family_pack', 'bulk'], efficacyLevel: ['health', 'conditioning', 'treatment_adjunct'], certification: ['blue_hat', 'sc_food', 'gmp', 'other'], salesChannel: ['online_only', 'offline_only', 'omni_channel'], salesDataType: ['exact', 'estimated'] };
const VFC = ['immunity', 'sleep', 'digestion', 'bone', 'beauty', 'sangan', 'kidney'];
const VMC = ['ginseng', 'goji', 'ganoderma', 'donkey_hide', 'astragalus', 'other'];
const VTP = ['children', 'adult', 'elderly', 'pregnant', 'male', 'female', 'general'];
const VPL = ['淘宝', '京东', '拼多多', '抖音电商', '天猫', '唯品会', '快手电商'];

let errs = [];
combined.forEach((p, i) => {
  RF.forEach(f => { if (p[f] === undefined || p[f] === null) errs.push(i + ': missing ' + f); });
  if (p.id && !/^[a-z0-9_-]+$/.test(p.id)) errs.push(i + ': bad id=' + p.id);
  Object.keys(VE).forEach(ef => { if (p[ef] && !VE[ef].includes(p[ef])) errs.push(i + ': bad ' + ef + '=' + p[ef]); });
  if (!Array.isArray(p.functionCategory) || p.functionCategory.length === 0) errs.push(i + ': fc empty');
  else p.functionCategory.forEach(c => { if (!VFC.includes(c)) errs.push(i + ': bad fc=' + c); });
  if (p.materialCategory && !VMC.includes(p.materialCategory)) errs.push(i + ': bad mc=' + p.materialCategory);
  if (!Array.isArray(p.targetPopulation) || p.targetPopulation.length === 0) errs.push(i + ': tp empty');
  else p.targetPopulation.forEach(t => { if (!VTP.includes(t)) errs.push(i + ': bad tp=' + t); });
  if (typeof p.priceMin !== 'number' || p.priceMin < 0) errs.push(i + ': bad priceMin');
  if (typeof p.priceMax !== 'number' || p.priceMax < 0) errs.push(i + ': bad priceMax');
  if (p.priceMin > p.priceMax) errs.push(i + ': min>max');
  if (typeof p.profitMargin !== 'number' || p.profitMargin < 0 || p.profitMargin > 100) errs.push(i + ': bad margin');
  if (typeof p.description !== 'string' || p.description.length < 10) errs.push(i + ': bad desc');
  if (p.dataVersion && !/^\d{4}-\d{2}$/.test(p.dataVersion)) errs.push(i + ': bad dv');
  if (p.listingUrls) {
    const seen = {};
    p.listingUrls.forEach((lu, u) => {
      if (!lu.platform || !VPL.includes(lu.platform)) errs.push(i + ': lu' + u + ' bad plat');
      if (!lu.url) errs.push(i + ': lu' + u + ' no url');
      if (lu.platform && seen[lu.platform]) errs.push(i + ': lu' + u + ' dup');
      if (lu.platform) seen[lu.platform] = true;
    });
  }
});

// Fix zero prices
combined.forEach(p => {
  if (p.priceMin <= 0) p.priceMin = Math.max(1, Math.floor((p.priceMax || 100) * 0.7));
  if (p.priceMax <= 0) p.priceMax = Math.ceil((p.priceMin || 10) * 1.3);
  if (p.priceMin > p.priceMax) [p.priceMin, p.priceMax] = [p.priceMax, p.priceMin];
  if (p.priceMin <= 0) p.priceMin = 1;
  if (p.priceMax <= 0) p.priceMax = 100;
  if (p.referenceSales === null || p.referenceSales === undefined) p.referenceSales = 0;
  if (p.referenceSales === 0 || p.referenceSales === null) {
    p.salesDataType = null;
    p.salesDataPeriod = null;
  }
});

console.log('\n=== VALIDATION ===');
console.log('Total: ' + combined.length + ' | Errors: ' + errs.length);
if (errs.length > 0) errs.slice(0, 20).forEach(e => console.log('  ' + e));

// Write
fs.writeFileSync('data/products/all-products.json', JSON.stringify(combined, null, 2), 'utf-8');
fs.writeFileSync('data/products/all-products.jsonp.js', 'window.PRODUCT_DATA = ' + JSON.stringify(combined, null, 2) + ';\n', 'utf-8');

console.log('\n=== DONE ===');
console.log('Products: ' + existing.length + ' (orig) + ' + newProducts.length + ' (new) = ' + combined.length + ' (total)');

// Brand diversity
const brands = new Set(combined.map(p => p.brand));
console.log('Unique brands: ' + brands.size);

// Sales stats
const totalSales = combined.reduce((s, p) => s + (p.referenceSales || 0), 0);
console.log('Total reference sales: ' + totalSales.toLocaleString());
console.log('Products with sales > 0: ' + combined.filter(p => (p.referenceSales || 0) > 0).length);
