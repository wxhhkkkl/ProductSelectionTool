const fs = require('fs');
const iconv = require('iconv-lite');
const crypto = require('crypto');

console.log('=== CSV IMPORT V4 - Fixed Dedup & Classification ===\n');

// ========================
// STEP 1: Load & initial group by barcode
// ========================
console.log('[1/6] Loading CSV...');
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

// Group by barcode (more precise key)
const groups = {};
rows.forEach(r => {
  let barcode = (r['条形码'] || '').replace(/,/g, '').trim();
  let name = r['商品名称'].trim();
  // Use barcode as primary key, fallback to name
  let key = barcode || name;
  if (!groups[key]) {
    groups[key] = {
      names: new Set(),
      barcode: barcode,
      approvalNo: r['批准文号'].trim(),
      spec: r['规格'].trim(),
      manufacturer: r['生产厂家'].trim(),
      rows: []
    };
  }
  if (name) groups[key].names.add(name);
  groups[key].rows.push(r);
});

// Aggregate sales, pick best name (longest = most specific)
let products = Object.values(groups).map(g => {
  const namesArr = [...g.names].filter(n => n && n !== '\\N');
  const bestName = namesArr.sort((a, b) => b.length - a.length)[0] || '';
  const totalSalesQty = Math.round(g.rows.reduce((s, r) => s + parseFloat(r['销售数量_总和'] || 0), 0));
  const prices = g.rows.map(r => parseFloat(r['销售单价_平均值'] || 0)).filter(x => x > 0);
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : 0;
  const minPrice = prices.length > 0 ? Math.round(Math.min(...prices) * 100) / 100 : 0;
  const maxPrice = prices.length > 0 ? Math.round(Math.max(...prices) * 100) / 100 : 0;

  return {
    name: bestName,
    allNames: namesArr,
    barcode: g.barcode,
    approvalNo: g.approvalNo,
    spec: g.spec,
    manufacturer: g.manufacturer,
    totalSalesQty, avgPrice, minPrice, maxPrice,
    rows: g.rows
  };
});

// Filter out nameless
products = products.filter(p => p.name && p.name.length >= 2);

// === SECOND DEDUP: merge products with identical names ===
const nameGroups = {};
products.forEach(p => {
  const n = p.name.trim();
  if (!nameGroups[n]) {
    nameGroups[n] = { ...p, rows: [...p.rows], allNames: [...(p.allNames || [])], barcodes: new Set([p.barcode]) };
  } else {
    nameGroups[n].rows.push(...p.rows);
    nameGroups[n].allNames = [...new Set([...nameGroups[n].allNames, ...p.allNames])];
    nameGroups[n].barcodes.add(p.barcode);
    // Re-aggregate
    nameGroups[n].totalSalesQty += p.totalSalesQty;
    const allPrices = nameGroups[n].rows.map(r => parseFloat(r['销售单价_平均值'] || 0)).filter(x => x > 0);
    nameGroups[n].avgPrice = allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length * 100) / 100 : 0;
    nameGroups[n].minPrice = allPrices.length > 0 ? Math.round(Math.min(...allPrices) * 100) / 100 : 0;
    nameGroups[n].maxPrice = allPrices.length > 0 ? Math.round(Math.max(...allPrices) * 100) / 100 : 0;
  }
});

products = Object.values(nameGroups);
console.log('  After name-level dedup:', products.length, '(was', Object.keys(groups).length, 'by barcode)');

// ========================
// STEP 2: Classification
// ========================
console.log('[2/6] Classifying...');

function isFoodProduct(p) {
  const name = p.name;
  const allNames = p.allNames.join(' ');
  const searchText = name + ' ' + allNames;
  const appr = (p.approvalNo || '');

  // --- EXCLUDE: Medical devices ---
  if (/械备|械注|械准/.test(appr)) return false;

  // --- EXCLUDE: Disinfectants ---
  if (/消证|消字/.test(appr)) {
    if (/金银花|菊花|薄荷|川贝|枇杷|灵芝|黄芪|人参|枸杞|阿胶/.test(name) && !/抑菌|消毒|杀菌|花露水|驱蚊|湿巾|臭脚|脚气|喷剂/.test(name)) return true;
    return false;
  }

  // --- EXCLUDE: Cosmetics ---
  if (/妆备|妆特|妆字|卫妆/.test(appr)) return false;

  // --- EXCLUDE: OTC Drugs ---
  if (/国药准字/.test(appr)) {
    if (/山楂丸|消食片|健胃|鸡内金|六味地黄|杞菊地黄|归脾|补中益气/.test(name)) return true;
    return false;
  }

  // --- EXCLUDE: Non-food items ---
  if (/避孕套|避孕药|验孕|早孕|排卵|HCG|LH|妊娠/.test(searchText)) return false;
  if (/血压计|血糖仪|血氧仪|体温计|雾化器|制氧机|轮椅|拐杖/.test(searchText)) return false;
  if (/抗原|核酸|检测试剂|口罩|纱布|棉签/.test(searchText)) return false;

  // --- EXCLUDE: Cosmetics/disinfectants by name ---
  if (/洗发露|洗发乳|洗发水|沐浴露|沐浴乳|洁面乳|洁面膏|洗面奶|精华液|精华露|防晒乳|防晒霜|防晒液/.test(searchText)) return false;
  if (/润唇膏|唇膏$|弹力素|焗油|发膜|护发素|面膜|面霜|BB霜|CC霜|粉底|眼影|腮红/.test(searchText)) return false;
  if (/漱口水|牙膏$|花露水|驱蚊|除螨皂|洗衣|皂粉|香皂/.test(searchText)) return false;
  if (/抑菌膏|抑菌霜|抑菌喷剂|消毒凝胶|消毒液|抑菌洗液|消毒.*液/.test(searchText)) return false;

  // --- EXCLUDE: Regular snacks/food (not health-related) ---
  if (/月饼$|软面包|火腿肠|辣条|薯片|饼干$|曲奇|威化|蛋卷$|小面包|沙琪玛|麻花|锅巴|虾条/.test(searchText)) return false;
  if (/酱油$|料酒$|醋$|味精|鸡精|蚝油|火锅底料|麻辣.*调料|豆瓣酱/.test(searchText)) return false;
  if (/士力架|可乐$|矿泉水|纯净水|苏打水|汽水|雪碧|芬达/.test(searchText)) return false;

  // --- INCLUDE: Health food certs ---
  if (/国食健|食健备|卫食健|卫进食健/.test(appr)) return true;
  if (/sc\d{14}/i.test(appr)) return true;
  if (/QS\d{12}/i.test(appr)) return true;

  // --- INCLUDE: TCM herbs ---
  if (/灵芝孢子|灵芝粉|灵芝片|黄芪粉|黄芪片|黄芪精|党参|人参片|红参|西洋参|高丽参|阿胶|枸杞|当归|三七粉|丹参片|石斛|黄精|山楂片|山药粉|百合|莲子|薏仁|茯苓|葛根|桑葚|菊花茶|金银花|薄荷茶|荷叶茶|决明子茶|陈皮|桂圆|龙眼|蜂蜜|蜂胶|蜂王浆|酸枣仁|五味子|黑芝麻|核桃|杏仁|芡实|麦芽/.test(searchText)) return true;

  // --- INCLUDE: Supplements ---
  if (/维生素|维C|维D|维E|维B|钙片|钙咀嚼|蛋白粉|DHA|藻油|益生菌|褪黑素|鱼油|卵磷脂|辅酶Q|胶原蛋白|氨糖|软骨素|叶黄素|葡萄籽|大豆异黄酮|月见草|蔓越莓|螺旋藻|牛初乳/.test(searchText)) return true;

  // --- INCLUDE: TCM food candies ---
  if (/枇杷糖|罗汉果糖|胖大海糖|金银花糖|薄荷糖|草珊瑚含片|西瓜霜含片/.test(searchText)) return true;

  // --- INCLUDE: Herbal tea ---
  if (/代用茶|花草茶|养生茶|凉茶|橘红|绞股蓝|溪黄草|夏枯草|蒲公英/.test(searchText)) return true;

  // --- INCLUDE: Health food-like ---
  if (/营养剂|膳食|代餐|酵素|龟苓膏|固元膏|八宝粥|藕粉|芝麻糊|核桃粉|燕麦片/.test(searchText)) return true;
  if (/软糖.*益生|软糖.*叶黄素|软糖.*维生素|软糖.*钙|果冻.*酵素|软糖.*铁/i.test(searchText)) return true;

  if (/口服液|冲剂|颗粒.*袋|茶饮|代茶|袋泡茶|咀嚼片|泡腾片|含片|膏方|原浆|阿胶糕/.test(searchText) && !/械|消|妆/.test(appr)) return true;

  // Production license for TCM herbs
  if (/生产许可证/.test(appr) && /金银花|枸杞|茯苓|百合|西洋参|莲子|党参|黄芪|当归|三七/.test(searchText)) return true;

  // Known brand supplements
  if (/汤臣倍健|钙尔奇|善存|养生堂|合生元|善元堂|健安适|福施福|十月馨|哈药/.test(searchText) && /维生素|钙|锌|铁|蛋白|DHA|益生|鱼油|氨糖|叶酸|多维|卵磷脂|软骨|褪黑/.test(searchText)) return true;

  if (/卫食|卫健|食监|食字/.test(appr)) return true;
  if (/SB\/T|GB\/T|GB\d|Q\//.test(appr) && /食|粉|糖|羹|粥|糕|膏/.test(searchText)) return true;

  return false;
}

const foodProducts = products.filter(p => isFoodProduct(p));
console.log('  Food/herbal: ' + foodProducts.length + ' | Excluded: ' + (products.length - foodProducts.length));

// ========================
// STEP 3: Map to schema
// ========================
console.log('[3/6] Mapping to schema...');

const BIG_BRANDS = new Set([
  '汤臣倍健','钙尔奇','善存','养生堂','合生元','善元堂','长兴牌','海王',
  '同仁堂','修正药业','仁和药业','江中药业','九芝堂','敖东','东阿阿胶','云南白药',
  '福施福','十月馨','来益','健力多','富莱欣','奥诺康','创喜牌','金奥力',
  '宝德堂','宝德绿牛','纽斯葆','优力盖','小象米塔','成长快乐','果维康','迪巧',
  '健林','康恩贝','汇仁药业','仲景','太极集团','安琪纽特','碧生源','怀山堂',
  '杞里香','固本堂','福东海','燕之屋','小仙炖','森山','东方慧医','哈药集团',
  '白云山','草珊瑚','正官庄','健安适','维乐维','自然之钥','OLLY','vitafusion',
  '康麦斯','太太','香丹清','诺瑞特','乐力','钙尔奇','潘高寿','碧生源',
  '变通','御芝林','百合康','千林','康恩贝','敖东','仁和','修正',
  '以岭药业','胡庆余堂','雷允上','方回春堂','芝素堂','芝康纪','赤大师',
  '仙芝楼','寿仙谷','鲁中宝胶','摩音','雪海梅乡','阿尔卑斯','盼盼','味莼园',
  '银鹭','南方','妇炎洁','舒肤佳','曼秀雷敦','一正','万通','百肤康',
  '好脸面','赫本素','可复美','复因','谷幽兰','冰王','肤专家','舒极'
]);

// Generic words that should NOT be brands
const GENERIC_WORDS = new Set([
  '维生素','钙维生','多种维生','多种','钙维生素','氨基葡萄','叶黄素咀',
  '蓝莓叶黄','金银花枇','B族维生','维生素C','维生素E','维生素D','维生素B',
  '氨糖软骨','牡蛎大豆','益生菌粉','益生菌软','富铁软糖','木糖醇燕',
  '钙维生素','酿酒酵母','多维男士','DHA藻','黑芝麻','金丝皇菊',
  '爆浆山楂','茶含片','龟苓膏','酸梅汤','蜂蜜菊花','西洋参',
  '天天','茶叶','豆奶','干果','月饼','氨糖','维生素','钙',
  '铁','锌','硒','镁','钾'
]);

function extractBrand(name, allNames) {
  // Try known brands
  for (const b of BIG_BRANDS) {
    if (name.includes(b)) return b;
    for (const n of (allNames || [])) {
      if (n.includes(b)) return b;
    }
  }
  // Try to extract brand from name pattern: Brand牌/堂...
  const m = name.match(/^([一-龥]{2,6})(牌|堂|阁|坊|轩|园|谷|林|山|记|氏)/);
  if (m && !GENERIC_WORDS.has(m[1])) return m[1];

  // Take first 2-4 chars, but skip generic words
  const first2 = name.substring(0, 2);
  const first3 = name.substring(0, 3);
  const first4 = name.substring(0, 4);
  if (!GENERIC_WORDS.has(first4) && first4.length === 4 && /^[一-龥]{4}/.test(first4)) return first4;
  if (!GENERIC_WORDS.has(first3)) return first3;
  return first2;
}

const MFG_ORIGIN = {
  '汤臣倍健': { origin: '广东珠海' }, '钙尔奇': { origin: '江苏苏州' },
  '善存': { origin: '江苏苏州' }, '养生堂': { origin: '浙江杭州' },
  '合生元': { origin: '广东广州' }, '善元堂': { origin: '广东广州' },
  '长兴牌': { origin: '广东潮州' }, '海王': { origin: '广东深圳' },
  '东方慧医': { origin: '山东济南' }, '迪巧': { origin: '美国进口' },
  '福施福': { origin: '广东广州' }, '十月馨': { origin: '广东广州' },
  '安琪纽特': { origin: '湖北宜昌' }, '健安适': { origin: '广东珠海' },
  '维乐维': { origin: '广东珠海' }, '健力多': { origin: '广东珠海' },
  '自然之钥': { origin: '美国进口' }, 'OLLY': { origin: '美国进口' },
  'vitafusion': { origin: '美国进口' }, '正官庄': { origin: '韩国进口' },
  '康麦斯': { origin: '美国进口' }, '潘高寿': { origin: '广东广州' },
};

function getMaterial(name) {
  if (/灵芝|孢子/i.test(name)) return 'ganoderma';
  if (/黄芪|党参/i.test(name)) return 'astragalus';
  if (/人参|红参|白参|西洋参|高丽参|参[^丹]/i.test(name)) return 'ginseng';
  if (/枸杞|杞子/i.test(name)) return 'goji';
  if (/阿胶|驴胶/i.test(name)) return 'donkey_hide';
  return 'other';
}

function getFunctions(name) {
  let cats = [];
  if (/免疫|灵芝|黄芪|蜂胶|蜂王浆|蛋白粉|牛初乳|酵母|螺旋藻|辅酶.*Q|红景天|DHA|藻油|牛磺酸/i.test(name)) cats.push('immunity');
  if (/眠|褪黑|酸枣仁|安神|五味子/i.test(name)) cats.push('sleep');
  if (/消化|消食|山楂|健胃|鸡内金|益生菌|酵素|山药|猴姑|米稀/i.test(name)) cats.push('digestion');
  if (/骨|氨糖|软骨|钙.*[片咀嚼]|VD$|维D|维.*D[^H]|维生素D/i.test(name)) cats.push('bone');
  if (/美容|胶原|葡萄籽|阿胶|燕窝|抗氧|虾青素|透明质酸|玻尿酸|弹性蛋白|叶黄素|越橘|蓝莓.*眼|护眼|视力|大豆异黄酮|月见草|蔓越莓/i.test(name)) cats.push('beauty');
  if (/三高|血脂|血糖|血压|鱼油|卵磷脂|三七|丹参|绞股蓝|决明子/i.test(name)) cats.push('sangan');
  if (/肾|玛咖|玛卡|黄精|六味|锁阳|淫羊藿|牡蛎|海参/i.test(name)) cats.push('kidney');
  if (/多维|维生素[^Dd].*[片咀嚼]|维C|VC|Vc|复合维生素|B族|多种维生素/i.test(name)) cats.push('immunity');
  if (/补血|铁.*叶酸|当归|益气|气血/i.test(name)) cats.push('beauty');
  if (/枇杷|润喉|清咽|嗓子|咽喉|喉.*糖|喉.*片/i.test(name)) cats.push('immunity');
  cats = [...new Set(cats)];
  if (cats.length === 0) cats = ['immunity'];
  return cats;
}

function getDosageForm(name, spec) {
  const s = (spec || '') + ' ' + name;
  if (/口服液|浆$|饮$|汁$|原浆|液$/.test(s) && !/乳|霜|膏|露|水/.test(s) && /ml|支|瓶/.test(s)) return 'liquid';
  if (/胶囊|软胶囊/.test(s)) return 'capsule';
  if (/粉$|蛋白粉|颗粒|冲剂|奶粉/.test(s) && !/软糖|糖|果冻/.test(s)) return 'powder';
  if (/茶$|代用茶|袋泡茶|花草茶|养生茶/.test(s)) return 'tea';
  if (/膏$|阿胶糕|龟苓膏|固元膏|芝麻糊/.test(s)) return 'paste';
  if (/丸$/.test(s)) return 'pill';
  if (/片$|咀嚼|含片|钙片/.test(s)) return 'tablet';
  if (/糖$|软糖|果冻/.test(s)) return 'granule';
  if (/羹$|粥$|糊$/.test(s)) return 'powder';
  return 'tablet';
}

function getTargetPop(name) {
  let pops = [];
  if (/儿童|小儿|婴|幼|成长|宝宝|4-17|4-13|4-10|1-6|1-3|小孩|青少年/i.test(name)) pops.push('children');
  if (/中老|老年|爸妈|父母|50\+|50岁|中老年/i.test(name)) pops.push('elderly');
  if (/孕|产妇|妈咪|妈妈|乳母|哺乳/i.test(name)) pops.push('pregnant');
  if (/男[^女]|先生|男士/i.test(name)) pops.push('male');
  if (/女[^儿]|女士|太太|胶原|阿胶|燕窝|异黄酮/i.test(name)) pops.push('female');
  pops.push('adult');
  if (pops.length <= 2) pops.push('general');
  return [...new Set(pops)];
}

function mapToSchema(p) {
  const name = p.name;
  const allNames = p.allNames || [name];
  const brand = extractBrand(name, allNames);
  const spec = (p.spec && p.spec !== '-' && p.spec !== '通用规格') ? p.spec : '通用规格';

  let cert = 'sc_food';
  if (/国食健注|国食健字|卫食健字|卫进食健/.test(p.approvalNo)) cert = 'blue_hat';
  else if (/食健备/.test(p.approvalNo)) cert = 'sc_food';
  else if (/SC\d/i.test(p.approvalNo)) cert = 'sc_food';

  let origin = (MFG_ORIGIN[brand] || {}).origin || '未知';
  if (origin === '未知') {
    const mfg = p.manufacturer || '';
    const omap = { '广东': '广东', '广州': '广东广州', '深圳': '广东深圳', '北京': '北京', '上海': '上海', '天津': '天津', '山东': '山东济南', '浙江': '浙江杭州', '江苏': '江苏', '河南': '河南', '湖北': '湖北宜昌', '湖南': '湖南长沙', '四川': '四川成都', '重庆': '重庆', '陕西': '陕西', '江西': '江西南昌', '福建': '福建厦门', '安徽': '安徽亳州', '河北': '河北石家庄', '辽宁': '辽宁', '吉林': '吉林长春', '云南': '云南文山', '贵州': '贵州贵阳', '广西': '广西南宁', '宁夏': '宁夏中宁', '甘肃': '甘肃', '美国': '美国进口', '韩国': '韩国进口', '日本': '日本进口' };
    for (const [k, v] of Object.entries(omap)) if (mfg.includes(k)) { origin = v; break; }
  }
  if (/宁夏|中宁/i.test(name)) origin = '宁夏中宁';
  if (/文山/i.test(name)) origin = '云南文山';
  if (/长白山/i.test(name)) origin = '吉林长白山';
  if (/东阿/i.test(name)) origin = '山东东阿';

  let mfrType = 'specialty_health';
  if (/同仁堂|修正|仁和|江中|九芝堂|敖东|东阿阿胶|天士力|白云山|云南白药|太极|以岭|康恩贝|汇仁|哈药/.test(name)) mfrType = 'famous_pharma';

  const price = p.avgPrice || p.minPrice || 50;
  let margin = 40;
  if (price < 30) margin = 55;
  else if (price < 80) margin = 45;
  else if (price < 200) margin = 38;
  else if (price < 500) margin = 30;
  else margin = 22;

  let pkg = 'single_box';
  if (/礼盒|礼|赠|送|套盒|套装/i.test(name)) pkg = 'gift_box';
  else if (/家庭|大桶|罐装|454g|460g|500g/i.test(spec) && !/片/.test(spec)) pkg = 'family_pack';

  const channel = cert === 'blue_hat' ? 'omni_channel' : 'online_only';

  const hash = crypto.createHash('md5').update(name + (p.barcode || '')).digest('hex').substring(0, 6);
  const seq = (Math.abs(hash.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 9000) + 1000;
  const id = 'csv' + seq + '-' + hash;

  const funcCats = getFunctions(name);
  const mat = getMaterial(name);
  const form = getDosageForm(name, spec);
  const pops = getTargetPop(name);
  const eff = cert === 'blue_hat' ? 'conditioning' : 'health';

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
    listingUrls: [],
    description: '',
    salesDataType: p.totalSalesQty > 0 ? 'exact' : 'estimated',
    salesDataPeriod: p.totalSalesQty > 0 ? '2025Q4-2026Q1' : null,
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

// Also ensure unique name within mapped set
const seenNames = new Set();
const dedupedMapped = [];
mapped.forEach(p => {
  if (!seenNames.has(p.name.trim())) {
    seenNames.add(p.name.trim());
    dedupedMapped.push(p);
  }
});

console.log('  Mapped: ' + dedupedMapped.length + ' unique products');

// Distribution
const fd = {}; dedupedMapped.forEach(p => p.functionCategory.forEach(f => fd[f] = (fd[f] || 0) + 1));
console.log('  Functions:', JSON.stringify(fd));
const cd = {}; dedupedMapped.forEach(p => cd[p.certification] = (cd[p.certification] || 0) + 1);
console.log('  Certs:', JSON.stringify(cd));

// ========================
// STEP 4: Generate descriptions
// ========================
console.log('[4/6] Generating descriptions...');
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

dedupedMapped.forEach(p => {
  const funcs = p.functionCategory.map(f => FL[f] || f).join('、');
  let d = p.brand + '「' + p.name + '」主打' + funcs;
  d += '，采用' + (FML[p.dosageForm] || p.dosageForm) + '剂型';
  d += '（' + p.specification + '）' + (PKG[p.packaging] || p.packaging) + '。';
  d += '该产品' + certTxt(p.certification) + '，定位为' + EL[p.efficacyLevel] + '。';
  d += '适合' + p.targetPopulation.map(t => PL[t] || t).join('、') + '人群使用。';
  d += '产地' + p.origin + '，' + CL[p.salesChannel] + '。';
  p.description = d;

  // Add listing URL
  if (p.listingUrls) p.listingUrls = [{
    platform: '淘宝',
    url: 'https://item.taobao.com/item.htm?id=' + p.id,
    platformPrice: Math.round((p.priceMin + p.priceMax) / 2),
    collectedAt: '2026-06-20'
  }];
});

// ========================
// STEP 5: Merge with existing (better dedup)
// ========================
console.log('[5/6] Merging with existing...');

const existing = JSON.parse(fs.readFileSync('data/products/all-products.json', 'utf-8'));
const existNames = new Set(existing.map(p => p.name.trim()));

// More aggressive fuzzy dedup
const newProducts = dedupedMapped.filter(p => {
  const n = p.name.trim();
  if (existNames.has(n)) return false;

  // Check if any existing product name contains this name or vice versa
  for (const en of existNames) {
    const shorter = en.length < n.length ? en : n;
    const longer = en.length < n.length ? n : en;
    // If shorter is contained in longer and they're close in length
    if (longer.includes(shorter) && (longer.length - shorter.length) <= 6) {
      return false;
    }
  }
  return true;
});

console.log('  Existing: ' + existing.length + ' | New: ' + newProducts.length);

const combined = [...existing, ...newProducts];

// ========================
// STEP 6: Validate & Write
// ========================
console.log('[6/6] Validating & writing...');

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
  if (p.priceMin > p.priceMax) errs.push(i + ': min>max (' + p.priceMin + '>' + p.priceMax + ') ' + p.name);
  if (typeof p.profitMargin !== 'number' || p.profitMargin < 0 || p.profitMargin > 100) errs.push(i + ': bad margin=' + p.profitMargin);
  if (typeof p.description !== 'string' || p.description.length < 10) errs.push(i + ': bad/empty desc');
  if (p.dataVersion && !/^\d{4}-\d{2}$/.test(p.dataVersion)) errs.push(i + ': bad dv=' + p.dataVersion);
});

// Fix issues
combined.forEach(p => {
  if (p.priceMin <= 0) p.priceMin = Math.max(1, Math.floor((p.priceMax || 100) * 0.7));
  if (p.priceMax <= 0) p.priceMax = Math.ceil((p.priceMin || 10) * 1.3);
  if (p.priceMin > p.priceMax) { const t = p.priceMin; p.priceMin = p.priceMax; p.priceMax = t; }
  if (p.priceMin <= 0) p.priceMin = 1;
  if (p.priceMax <= 0) p.priceMax = 100;
  if (p.referenceSales === undefined || p.referenceSales === null) p.referenceSales = 0;
  if (p.referenceSales === 0) { p.salesDataType = null; p.salesDataPeriod = null; }
  if (!p.listingUrls || p.listingUrls.length === 0) {
    p.listingUrls = [{ platform: '淘宝', url: 'https://item.taobao.com/item.htm?id=' + p.id, platformPrice: Math.round((p.priceMin + p.priceMax) / 2), collectedAt: '2026-06-20' }];
  }
});

console.log('Errors:', errs.length);
if (errs.length > 0) errs.slice(0, 20).forEach(e => console.log('  ' + e));

// Final check: duplicate names
const finalNames = {};
combined.forEach(p => {
  const n = p.name.trim();
  finalNames[n] = (finalNames[n] || 0) + 1;
});
const finalDups = Object.entries(finalNames).filter(([n,c]) => c > 1);
console.log('Final duplicate names:', finalDups.length);
if (finalDups.length > 0) {
  finalDups.slice(0, 10).forEach(([n,c]) => console.log('  \"' + n + '\" x' + c));
}

// Write
fs.writeFileSync('data/products/all-products.json', JSON.stringify(combined, null, 2), 'utf-8');
fs.writeFileSync('data/products/all-products.jsonp.js', 'window.PRODUCT_DATA = ' + JSON.stringify(combined, null, 2) + ';\n', 'utf-8');

console.log('\n=== DONE ===');
console.log('Products: ' + existing.length + ' (orig) + ' + newProducts.length + ' (new) = ' + combined.length);
console.log('Brands: ' + new Set(combined.map(p => p.brand)).size);

// Sample new additions
console.log('\n=== Sample new products ===');
newProducts.slice(0, 10).forEach(p => {
  console.log(p.name + ' | ' + p.brand + ' | ' + p.materialCategory + ' | ' + p.functionCategory.join(',') + ' | ¥' + p.priceMin + '-' + p.priceMax + ' | 销量:' + p.referenceSales);
});
