const fs = require('fs');
const iconv = require('iconv-lite');
const crypto = require('crypto');

// ========================
// STEP 1: Load CSV
// ========================
console.log('Loading CSV...');
const buf = fs.readFileSync('DataWorks_数据开发_20260624094418_0.csv');
const text = iconv.decode(buf, 'GBK');
const lines = text.split('\n').filter(l => l.trim());
const header = lines[0].split(',').map(h => h.trim().replace('\r', ''));
console.log('Header:', header.join(', '));

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const vals = lines[i].split(',');
  const row = {};
  header.forEach((h, j) => row[h] = (vals[j] || '').trim());
  rows.push(row);
}
console.log('Total rows:', rows.length);

// ========================
// STEP 2: Group by barcode+name to deduplicate
// ========================
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

// Filter out nameless
let products = Object.values(groups).filter(p => {
  const name = p.name;
  if (!name || name === '\\N' || name.trim() === '' || name.length < 2) return false;
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

console.log('Unique products:', products.length);

// ========================
// STEP 3: Classify - is this a food/health/herbal product?
// ========================

function isFoodProduct(p) {
  const name = (p.name + ' ' + p.genericName).toLowerCase();
  const appr = (p.approvalNo || '').toLowerCase();

  // === BLOCK: Definitely NON-food (exclude first) ===

  // Medical devices - 械字号 products
  if (/械备|械注|械准/.test(appr)) {
    // Some 械字号 are actually skincare/supplements sold through pharmacy loophole
    // But they're not food - exclude unless they're clearly herbal food
    if (/敷料|敷贴|冷敷|退热|退烧|鼻贴|通气|远红外|穴位.*贴|灸|止血|创口|伤口|绷带|固定|矫形|雾化|血氧|血压|血糖|体温|轮椅|坐便|助行|口罩|纱布|棉球|棉签|手套|注射|输液|导尿|采血|护腰带|护膝|护踝|护腕|静脉|造口|造瘘|手术|缝线/.test(name)) {
      return false;
    }
    // Some 皮肤保护剂 are actually lip balms sold under 械字号 - borderline
    if (/皮肤保护剂.*唇|给药器/.test(name)) return false;
  }

  // Disinfectants - 消字号
  if (/消证|消字/.test(appr)) {
    // Check if it's actually a herbal/food product disguised as disinfectant
    if (/抑菌.*膏|抑菌.*霜|抑菌.*液|抑菌.*洗|消毒.*凝胶|消毒.*液|湿巾|臭脚|脚气|真菌/.test(name)) {
      return false;
    }
    // Some TCM-named products use 消字号 but are herbal - check if food-related
    if (/灵芝|黄芪|人参|枸杞|阿胶|山楂|金银花|菊花|薄荷|川贝|枇杷/.test(name)) {
      return true; // herbal food product, include it
    }
    return false;
  }

  // Cosmetics - 妆字号
  if (/妆备|妆特|妆字/.test(appr)) {
    if (/洗.*露|护.*素|沐浴|洗发|洁面|面膜|面霜|精华|防晒|BB霜|CC霜|粉底|口红|唇膏|眉笔|眼影|腮红/.test(name)) {
      return false;
    }
    if (/乳|霜|液|露/.test(name) && !/口服|食品|食|茶|粉|丸|片/.test(name)) return false;
  }

  // OTC drugs (国药准字) - exclude unless it's a well-known TCM food homology product
  if (/国药准字/.test(appr)) {
    // Some 药食同源 items are also sold as OTC drugs (e.g., 山楂丸, 六味地黄丸)
    // Include well-known TCM food/herbal drugs
    if (/山楂丸|消食片|健胃|鸡内金|六味地黄|杞菊地黄|知柏地黄|归脾|补中益气|生脉|板蓝根|双黄连|藿香正气|小柴胡/.test(name)) {
      return true;
    }
    return false;
  }

  // === BLOCK: Definitely non-food by name ===
  if (/避孕套|避孕药|验孕|早孕|排卵|HCG|LH|妊娠/.test(name)) return false;
  if (/血压计|血糖仪|血氧仪|体温计|雾化器|制氧机|轮椅|拐杖|坐便椅/.test(name)) return false;
  if (/抗原.*检测|新冠.*检测|核酸.*检测/.test(name)) return false;
  if (/士力架|可乐|矿泉水|方便面|薯片|辣条/.test(name)) return false;

  // === BLOCK: Definitely FOOD ===
  // Health food certifications
  if (/国食健|食健备|卫食健/.test(appr)) return true;
  // SC food cert
  if (/sc\d{14}/i.test(appr)) return true;
  // QS food cert
  if (/QS\d{12}/i.test(appr)) return true;

  // TCM food homology herbs by name
  if (/灵芝孢子|灵芝粉|灵芝片|灵芝胶囊|黄芪粉|黄芪片|黄芪精|党参|人参片|红参|西洋参|高丽参|阿胶|枸杞|当归片|当归粉|三七粉|丹参片|石斛|黄精|山楂片|山楂粉|山药粉|山药片|百合|莲子|薏仁|茯苓|葛根|桑葚|菊花茶|金银花|薄荷茶|荷叶茶|决明子茶|陈皮|桂圆|龙眼|红枣|枣片|蜂蜜|蜂胶|蜂王浆|酸枣仁|五味子|黑芝麻|核桃|杏仁|芡实|麦芽/.test(name)) return true;

  // Western supplements / health products
  if (/维生素|维C|维D|维E|维B|钙片|钙咀嚼|钙.*软胶囊|锌咀嚼|锌片|铁.*叶酸|蛋白粉|DHA|藻油|益生菌|褪黑素|鱼油|卵磷脂|辅酶Q|胶原蛋白|氨糖|软骨素|叶黄素|葡萄籽|大豆异黄酮|月见草|蔓越莓|螺旋藻|牛初乳/.test(name)) return true;

  // Food-like candies/lozenges from TCM
  if (/枇杷糖|润喉糖|罗汉果糖|胖大海糖|金银花糖|薄荷糖|草珊瑚含片|西瓜霜含片/.test(name)) return true;

  // Herbal teas/drinks
  if (/代用茶|花草茶|养生茶|凉茶|橘红|化橘红|绞股蓝|溪黄草|夏枯草|车前草|蒲公英|鱼腥草|金银花露/.test(name)) return true;

  // Food products (SC certified but maybe missed)
  if (/粉|羹|糊|糕|饼|酥|膏|酱|蜜|脯|干|坚果|果冻|代餐|奶昔|酵素|阿胶|龟苓膏/.test(name) && /食|sc|qs/i.test(appr)) return true;

  // TCM food homology even if no clear cert (by approval content)
  if (/卫食|卫健|食监|食字/.test(appr)) return true;

  // If name contains typical food/herb indicators and NOT medical/device/disinfectant
  const foodWords = /口服液|冲剂|颗粒|茶饮|代茶|袋泡茶|咀嚼片|泡腾片|含片|膏方|原浆|阿胶糕|固元膏|龟苓膏|养生|滋补|调理|保健|营养|膳食|食补|药膳|汤料|煲汤|炖品|即食|零食|代餐/;
  if (foodWords.test(name) && !/械|消|妆|准字/.test(appr)) return true;

  return false;
}

// Apply filter
const foodProducts = products.filter(p => isFoodProduct(p));
const excluded = products.length - foodProducts.length;

const apprDist = {};
foodProducts.forEach(p => {
  const a = p.approvalNo;
  if (/国食健注/.test(a)) apprDist['blue_hat(国食健注)'] = (apprDist['blue_hat(国食健注)'] || 0) + 1;
  else if (/国食健字/.test(a)) apprDist['blue_hat(国食健字)'] = (apprDist['blue_hat(国食健字)'] || 0) + 1;
  else if (/食健备/.test(a)) apprDist['sc_food(食健备)'] = (apprDist['sc_food(食健备)'] || 0) + 1;
  else if (/卫食健/.test(a)) apprDist['health_food(卫食健)'] = (apprDist['health_food(卫食健)'] || 0) + 1;
  else if (/SC\d/i.test(a)) apprDist['food(SC)'] = (apprDist['food(SC)'] || 0) + 1;
  else if (/QS\d/i.test(a)) apprDist['food(QS)'] = (apprDist['food(QS)'] || 0) + 1;
  else apprDist['other/no_cert'] = (apprDist['other/no_cert'] || 0) + 1;
});

console.log('\n=== CLASSIFICATION RESULT ===');
console.log('Food/herbal products: ' + foodProducts.length);
console.log('Excluded (non-food): ' + excluded);
console.log('By cert type:', JSON.stringify(apprDist, null, 2));

// Sales distribution
const salesRanges = { '0': 0, '1-9': 0, '10-99': 0, '100-999': 0, '1000-9999': 0, '10000+': 0 };
foodProducts.forEach(p => {
  const s = p.totalSalesQty;
  if (s === 0) salesRanges['0']++;
  else if (s < 10) salesRanges['1-9']++;
  else if (s < 100) salesRanges['10-99']++;
  else if (s < 1000) salesRanges['100-999']++;
  else if (s < 10000) salesRanges['1000-9999']++;
  else salesRanges['10000+']++;
});
console.log('Sales distribution:', JSON.stringify(salesRanges));

// Show some samples of included products
console.log('\n=== Sample food products ===');
[0, 50, 100, 200, 300, 400].forEach(i => {
  if (foodProducts[i]) {
    const p = foodProducts[i];
    console.log((i+1) + '. ' + p.name + ' | 文号:' + p.approvalNo.substring(0, 20) + ' | 销量:' + p.totalSalesQty + ' | ¥' + p.avgPrice);
  }
});

// Save for next step
fs.writeFileSync('data/products/food_products_raw.json', JSON.stringify(foodProducts, null, 2), 'utf-8');
console.log('\nSaved ' + foodProducts.length + ' food products to food_products_raw.json');
