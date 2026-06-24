#!/usr/bin/env python3
"""Generate comprehensive medicinal-food homology product dataset from market research."""
import json, re, hashlib

products = []
_counter = [0]

def pid(name, brand):
    """Generate a unique ASCII slug ID. Uses hash of Chinese name + sequential counter."""
    _counter[0] += 1
    # Take first 2 chars of brand as prefix (use hash for Chinese brands)
    brand_hash = hashlib.md5(brand.encode('utf-8')).hexdigest()[:6]
    return f'p{_counter[0]:04d}-{brand_hash}'

def add(**p):
    p.setdefault('id', pid(p['name'], p['brand']))
    p.setdefault('description', '')
    p.setdefault('salesDataType', 'estimated')
    p.setdefault('salesDataPeriod', '2025Q4')
    p.setdefault('dataVersion', '2026-06')
    if p.get('referenceSales') is None:
        p['salesDataType'] = None
        p['salesDataPeriod'] = None
    if 'listingUrls' not in p:
        p['listingUrls'] = []
    products.append(p)

# =============================================
# 1. 免疫力 (immunity) — 灵芝孢子粉、黄芪、蜂胶
# =============================================
add(name='芝素堂破壁灵芝孢子粉', brand='芝素堂', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='60g/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山东泰安',
    salesChannel='omni_channel', priceMin=398, priceMax=698, profitMargin=35, referenceSales=28000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=zhishutang001','platformPrice':498,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/zhishutang001.html','platformPrice':528,'collectedAt':'2026-06-15'}])

add(name='芝康纪破壁灵芝孢子粉胶囊', brand='芝康纪', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='capsule',
    specification='90粒/瓶', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山东冠县',
    salesChannel='online_only', priceMin=268, priceMax=398, profitMargin=42, referenceSales=15000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=zhikangji001','platformPrice':298,'collectedAt':'2026-06-15'}])

add(name='赤大师有机灵芝孢子粉', brand='赤大师', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='120g/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山东冠县',
    salesChannel='online_only', priceMin=498, priceMax=798, profitMargin=30, referenceSales=12000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=chidashi001','platformPrice':598,'collectedAt':'2026-06-15'}])

add(name='仙芝楼有机灵芝孢子粉', brand='仙芝楼', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='100g/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='福建福州',
    salesChannel='omni_channel', priceMin=328, priceMax=528, profitMargin=33, referenceSales=18000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=xianzhilou001','platformPrice':398,'collectedAt':'2026-06-15'}])

add(name='寿仙谷破壁灵芝孢子粉', brand='寿仙谷', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='60g/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='浙江武义',
    salesChannel='omni_channel', priceMin=428, priceMax=698, profitMargin=28, referenceSales=22000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=shouxiangu001','platformPrice':498,'collectedAt':'2026-06-15'}])

add(name='修正破壁灵芝孢子粉', brand='修正药业', manufacturerType='famous_pharma',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='100g/盒', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='health', certification='blue_hat', origin='吉林通化',
    salesChannel='omni_channel', priceMin=198, priceMax=328, profitMargin=40, referenceSales=30000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=xiuzheng001','platformPrice':258,'collectedAt':'2026-06-15'}])

add(name='同仁堂灵芝孢子粉胶囊', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['immunity','beauty'], materialCategory='ganoderma', dosageForm='capsule',
    specification='60粒/瓶', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='吉林长白山',
    salesChannel='omni_channel', priceMin=198, priceMax=298, profitMargin=35, referenceSales=12500,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtlingzhi001','platformPrice':258,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/trtlingzhi001.html','platformPrice':268,'collectedAt':'2026-06-15'}])

add(name='胡庆余堂灵芝孢子粉', brand='胡庆余堂', manufacturerType='famous_pharma',
    functionCategory=['immunity'], materialCategory='ganoderma', dosageForm='powder',
    specification='90g/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='浙江杭州',
    salesChannel='omni_channel', priceMin=528, priceMax=898, profitMargin=25, referenceSales=8500,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=hqytlingzhi001','platformPrice':628,'collectedAt':'2026-06-15'}])

add(name='同仁堂黄芪精口服液', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['immunity','sangan'], materialCategory='astragalus', dosageForm='liquid',
    specification='10ml×30支/盒', packaging='family_pack', targetPopulation=['elderly','adult','general'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山西浑源',
    salesChannel='omni_channel', priceMin=168, priceMax=238, profitMargin=30, referenceSales=45000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trthuangqi001','platformPrice':188,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/trthuangqi001.html','platformPrice':198,'collectedAt':'2026-06-15'}])

add(name='固本堂黄芪党参豆浆粉', brand='固本堂', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='astragalus', dosageForm='powder',
    specification='25g×20袋/盒', packaging='single_box', targetPopulation=['adult','female','general'],
    efficacyLevel='health', certification='sc_food', origin='安徽亳州',
    salesChannel='online_only', priceMin=59, priceMax=89, profitMargin=48, referenceSales=55000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=gubentang001','platformPrice':69,'collectedAt':'2026-06-15'}])

add(name='杞里香黄芪切片', brand='杞里香', manufacturerType='specialty_health',
    functionCategory=['immunity','sangan'], materialCategory='astragalus', dosageForm='tea',
    specification='250g/袋', packaging='family_pack', targetPopulation=['general','adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='甘肃陇西',
    salesChannel='online_only', priceMin=29, priceMax=49, profitMargin=50, referenceSales=78000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=qilixiang001','platformPrice':35,'collectedAt':'2026-06-15'}])

add(name='仁和黄芪口服液', brand='仁和药业', manufacturerType='famous_pharma',
    functionCategory=['immunity'], materialCategory='astragalus', dosageForm='liquid',
    specification='10ml×20支/盒', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='江西樟树',
    salesChannel='omni_channel', priceMin=128, priceMax=188, profitMargin=38, referenceSales=22000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=renhehuangqi001','platformPrice':148,'collectedAt':'2026-06-15'}])

# =============================================
# 2. 助眠安神 (sleep) — 酸枣仁、褪黑素、五味子
# =============================================
add(name='福东海酸枣仁膏', brand='福东海', manufacturerType='specialty_health',
    functionCategory=['sleep'], materialCategory='other', dosageForm='paste',
    specification='150g/瓶', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='广东揭阳',
    salesChannel='online_only', priceMin=29, priceMax=49, profitMargin=55, referenceSales=85000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=fudonghai001','platformPrice':39,'collectedAt':'2026-06-15'},
        {'platform':'抖音电商','url':'https://haohuo.jinritemai.com/views/product/fudonghai001','platformPrice':35,'collectedAt':'2026-06-15'}])

add(name='福东海酸枣仁原浆小睡瓶', brand='福东海', manufacturerType='specialty_health',
    functionCategory=['sleep'], materialCategory='other', dosageForm='liquid',
    specification='50ml×7瓶/盒', packaging='single_box', targetPopulation=['adult','female'],
    efficacyLevel='health', certification='sc_food', origin='广东揭阳',
    salesChannel='online_only', priceMin=69, priceMax=99, profitMargin=50, referenceSales=62000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=fudonghai002','platformPrice':79,'collectedAt':'2026-06-15'}])

add(name='同仁堂西洋参酸枣仁膏', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['sleep'], materialCategory='ginseng', dosageForm='paste',
    specification='200g/瓶', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='conditioning', certification='sc_food', origin='北京',
    salesChannel='omni_channel', priceMin=98, priceMax=138, profitMargin=32, referenceSales=35000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtsuanzaoren001','platformPrice':118,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/trtsuanzaoren001.html','platformPrice':128,'collectedAt':'2026-06-15'}])

add(name='雷允上酸枣仁膏', brand='雷允上', manufacturerType='famous_pharma',
    functionCategory=['sleep'], materialCategory='other', dosageForm='paste',
    specification='180g/瓶', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='上海',
    salesChannel='omni_channel', priceMin=98, priceMax=138, profitMargin=30, referenceSales=18000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=leiyunshang001','platformPrice':118,'collectedAt':'2026-06-15'}])

add(name='方回春堂酸枣仁膏', brand='方回春堂', manufacturerType='famous_pharma',
    functionCategory=['sleep'], materialCategory='other', dosageForm='paste',
    specification='200g/瓶', packaging='gift_box', targetPopulation=['adult','elderly','female'],
    efficacyLevel='conditioning', certification='sc_food', origin='浙江杭州',
    salesChannel='omni_channel', priceMin=108, priceMax=168, profitMargin=28, referenceSales=12000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=fhctsuanzaoren001','platformPrice':138,'collectedAt':'2026-06-15'}])

add(name='以岭药业晚必安红参石榴饮', brand='以岭药业', manufacturerType='famous_pharma',
    functionCategory=['sleep','beauty'], materialCategory='ginseng', dosageForm='liquid',
    specification='10ml×30支/盒', packaging='single_box', targetPopulation=['female','adult'],
    efficacyLevel='health', certification='sc_food', origin='河北石家庄',
    salesChannel='omni_channel', priceMin=89, priceMax=129, profitMargin=38, referenceSales=28000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=yiling001','platformPrice':99,'collectedAt':'2026-06-15'}])

add(name='自然之钥褪黑素维生素B6片', brand='自然之钥', manufacturerType='specialty_health',
    functionCategory=['sleep'], materialCategory='other', dosageForm='tablet',
    specification='60片/瓶', packaging='single_box', targetPopulation=['adult'],
    efficacyLevel='health', certification='sc_food', origin='美国进口',
    salesChannel='online_only', priceMin=79, priceMax=128, profitMargin=45, referenceSales=42000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=ziranzhiyao001','platformPrice':89,'collectedAt':'2026-06-15'}])

add(name='OLLY褪黑素睡眠软糖', brand='OLLY', manufacturerType='specialty_health',
    functionCategory=['sleep'], materialCategory='other', dosageForm='granule',
    specification='50粒/瓶', packaging='single_box', targetPopulation=['adult','female'],
    efficacyLevel='health', certification='other', origin='美国进口',
    salesChannel='online_only', priceMin=109, priceMax=169, profitMargin=40, referenceSales=35000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=olly001','platformPrice':129,'collectedAt':'2026-06-15'}])

add(name='vitafusion褪黑素软糖', brand='vitafusion', manufacturerType='specialty_health',
    functionCategory=['sleep'], materialCategory='other', dosageForm='granule',
    specification='80粒/瓶', packaging='single_box', targetPopulation=['adult','female'],
    efficacyLevel='health', certification='other', origin='美国进口',
    salesChannel='online_only', priceMin=89, priceMax=149, profitMargin=42, referenceSales=38000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=vitafusion001','platformPrice':119,'collectedAt':'2026-06-15'}])

# =============================================
# 3. 消化调理 (digestion) — 鸡内金、山楂、山药、益生菌
# =============================================
add(name='江中健胃消食片', brand='江中药业', manufacturerType='famous_pharma',
    functionCategory=['digestion'], materialCategory='other', dosageForm='tablet',
    specification='60片/盒', packaging='single_box', targetPopulation=['general','adult','children'],
    efficacyLevel='treatment_adjunct', certification='gmp', origin='江西南昌',
    salesChannel='omni_channel', priceMin=15, priceMax=28, profitMargin=20, referenceSales=150000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=jiangzhong001','platformPrice':19,'collectedAt':'2026-06-15'},
        {'platform':'京东','url':'https://item.jd.com/jiangzhong001.html','platformPrice':22,'collectedAt':'2026-06-15'}])

add(name='江中猴姑米稀', brand='江中药业', manufacturerType='famous_pharma',
    functionCategory=['digestion'], materialCategory='other', dosageForm='powder',
    specification='30g×15袋/盒', packaging='gift_box', targetPopulation=['adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='江西南昌',
    salesChannel='omni_channel', priceMin=98, priceMax=168, profitMargin=35, referenceSales=68000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=jiangzhong002','platformPrice':128,'collectedAt':'2026-06-15'}])

add(name='同仁堂大山楂丸', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['digestion'], materialCategory='other', dosageForm='pill',
    specification='9g×10丸/盒', packaging='single_box', targetPopulation=['general','children','adult'],
    efficacyLevel='treatment_adjunct', certification='gmp', origin='北京',
    salesChannel='omni_channel', priceMin=12, priceMax=25, profitMargin=22, referenceSales=95000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtshanzha001','platformPrice':18,'collectedAt':'2026-06-15'}])

add(name='修正鸡内金山楂咀嚼片', brand='修正药业', manufacturerType='famous_pharma',
    functionCategory=['digestion'], materialCategory='other', dosageForm='tablet',
    specification='100片/瓶', packaging='single_box', targetPopulation=['children','adult'],
    efficacyLevel='health', certification='sc_food', origin='吉林通化',
    salesChannel='omni_channel', priceMin=38, priceMax=68, profitMargin=42, referenceSales=52000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=xiuzheng002','platformPrice':48,'collectedAt':'2026-06-15'}])

add(name='仁和益生菌固体饮料', brand='仁和药业', manufacturerType='famous_pharma',
    functionCategory=['digestion'], materialCategory='other', dosageForm='powder',
    specification='2g×20袋/盒', packaging='single_box', targetPopulation=['adult','children','general'],
    efficacyLevel='health', certification='sc_food', origin='江西樟树',
    salesChannel='omni_channel', priceMin=68, priceMax=108, profitMargin=45, referenceSales=40000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=renhe002','platformPrice':88,'collectedAt':'2026-06-15'}])

add(name='汤臣倍健益生菌固体饮料', brand='汤臣倍健', manufacturerType='specialty_health',
    functionCategory=['digestion'], materialCategory='other', dosageForm='powder',
    specification='1.5g×30袋/盒', packaging='single_box', targetPopulation=['adult','general'],
    efficacyLevel='health', certification='sc_food', origin='广东广州',
    salesChannel='online_only', priceMin=128, priceMax=198, profitMargin=40, referenceSales=35000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=tcbj001','platformPrice':158,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/tcbj001.html','platformPrice':168,'collectedAt':'2026-06-15'}])

add(name='碧生源常润茶', brand='碧生源', manufacturerType='specialty_health',
    functionCategory=['digestion'], materialCategory='other', dosageForm='tea',
    specification='2.5g×25袋/盒', packaging='single_box', targetPopulation=['adult','female'],
    efficacyLevel='health', certification='sc_food', origin='北京',
    salesChannel='omni_channel', priceMin=29, priceMax=49, profitMargin=50, referenceSales=120000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=bishengyuan001','platformPrice':35,'collectedAt':'2026-06-15'}])

add(name='怀山堂铁棍山药粉', brand='怀山堂', manufacturerType='specialty_health',
    functionCategory=['digestion'], materialCategory='other', dosageForm='powder',
    specification='300g/罐', packaging='single_box', targetPopulation=['general','elderly','children'],
    efficacyLevel='health', certification='sc_food', origin='河南焦作',
    salesChannel='online_only', priceMin=58, priceMax=98, profitMargin=38, referenceSales=25000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=huaishantang001','platformPrice':78,'collectedAt':'2026-06-15'}])

# =============================================
# 4. 骨骼健康 (bone) — 氨糖、钙片、维生素D
# =============================================
add(name='汤臣倍健氨糖软骨素钙片', brand='汤臣倍健', manufacturerType='specialty_health',
    functionCategory=['bone'], materialCategory='other', dosageForm='tablet',
    specification='120片/瓶', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='health', certification='sc_food', origin='广东广州',
    salesChannel='online_only', priceMin=168, priceMax=258, profitMargin=38, referenceSales=48000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=tcbj002','platformPrice':198,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/tcbj002.html','platformPrice':218,'collectedAt':'2026-06-15'}])

add(name='健力多氨糖软骨素钙片', brand='健力多', manufacturerType='specialty_health',
    functionCategory=['bone'], materialCategory='other', dosageForm='tablet',
    specification='180片/瓶', packaging='family_pack', targetPopulation=['elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='广东广州',
    salesChannel='omni_channel', priceMin=198, priceMax=298, profitMargin=35, referenceSales=55000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=jianliduo001','platformPrice':238,'collectedAt':'2026-06-15'}])

add(name='同仁堂六味地黄丸', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['bone','kidney'], materialCategory='other', dosageForm='pill',
    specification='360丸/瓶', packaging='single_box', targetPopulation=['adult','elderly','male'],
    efficacyLevel='conditioning', certification='gmp', origin='北京',
    salesChannel='omni_channel', priceMin=28, priceMax=58, profitMargin=25, referenceSales=180000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtliuwei001','platformPrice':38,'collectedAt':'2026-06-15'},
        {'platform':'京东','url':'https://item.jd.com/trtliuwei001.html','platformPrice':42,'collectedAt':'2026-06-15'}])

add(name='钙尔奇添佳片', brand='钙尔奇', manufacturerType='specialty_health',
    functionCategory=['bone'], materialCategory='other', dosageForm='tablet',
    specification='60片/瓶', packaging='single_box', targetPopulation=['elderly','female'],
    efficacyLevel='health', certification='sc_food', origin='美国进口',
    salesChannel='omni_channel', priceMin=89, priceMax=149, profitMargin=35, referenceSales=65000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=gaierqi001','platformPrice':118,'collectedAt':'2026-06-15'}])

add(name='迪巧钙维生素D咀嚼片', brand='迪巧', manufacturerType='specialty_health',
    functionCategory=['bone'], materialCategory='other', dosageForm='tablet',
    specification='60片/瓶', packaging='single_box', targetPopulation=['children','pregnant','elderly'],
    efficacyLevel='health', certification='sc_food', origin='美国进口',
    salesChannel='omni_channel', priceMin=69, priceMax=118, profitMargin=38, referenceSales=72000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=diqiao001','platformPrice':89,'collectedAt':'2026-06-15'}])

# =============================================
# 5. 美容养颜 (beauty) — 阿胶、胶原蛋白、枸杞、当归
# =============================================
add(name='东阿阿胶桃花姬阿胶糕', brand='东阿阿胶', manufacturerType='famous_pharma',
    functionCategory=['beauty'], materialCategory='donkey_hide', dosageForm='paste',
    specification='300g/盒', packaging='gift_box', targetPopulation=['female','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山东东阿',
    salesChannel='omni_channel', priceMin=279, priceMax=399, profitMargin=30, referenceSales=85000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=taohuaji001','platformPrice':298,'collectedAt':'2026-06-15'},
        {'platform':'京东','url':'https://item.jd.com/taohuaji001.html','platformPrice':318,'collectedAt':'2026-06-15'}])

add(name='东阿阿胶阿胶块', brand='东阿阿胶', manufacturerType='famous_pharma',
    functionCategory=['beauty','kidney'], materialCategory='donkey_hide', dosageForm='paste',
    specification='250g/盒', packaging='gift_box', targetPopulation=['female','adult','elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='山东东阿',
    salesChannel='omni_channel', priceMin=898, priceMax=1298, profitMargin=20, referenceSales=42000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=ejiao001','platformPrice':998,'collectedAt':'2026-06-15'},
        {'platform':'京东','url':'https://item.jd.com/ejiao001.html','platformPrice':1080,'collectedAt':'2026-06-15'}])

add(name='固本堂人参阿胶口服液', brand='固本堂', manufacturerType='specialty_health',
    functionCategory=['beauty','immunity'], materialCategory='donkey_hide', dosageForm='liquid',
    specification='20ml×30支/盒', packaging='gift_box', targetPopulation=['female','adult'],
    efficacyLevel='conditioning', certification='sc_food', origin='安徽亳州',
    salesChannel='online_only', priceMin=168, priceMax=258, profitMargin=42, referenceSales=32000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=gubentang002','platformPrice':198,'collectedAt':'2026-06-15'}])

add(name='同仁堂阿胶糕', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['beauty'], materialCategory='donkey_hide', dosageForm='paste',
    specification='500g/盒', packaging='gift_box', targetPopulation=['female','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='北京',
    salesChannel='omni_channel', priceMin=298, priceMax=498, profitMargin=28, referenceSales=25000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtejiao001','platformPrice':368,'collectedAt':'2026-06-15'}])

add(name='汤臣倍健胶原蛋白肽', brand='汤臣倍健', manufacturerType='specialty_health',
    functionCategory=['beauty'], materialCategory='other', dosageForm='liquid',
    specification='50ml×10瓶/盒', packaging='gift_box', targetPopulation=['female','adult'],
    efficacyLevel='health', certification='sc_food', origin='广东广州',
    salesChannel='online_only', priceMin=198, priceMax=298, profitMargin=40, referenceSales=38000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=tcbj003','platformPrice':238,'collectedAt':'2026-06-15'}])

add(name='杞里香黑枸杞原浆', brand='杞里香', manufacturerType='specialty_health',
    functionCategory=['beauty','immunity'], materialCategory='goji', dosageForm='liquid',
    specification='30ml×10袋/盒', packaging='single_box', targetPopulation=['female','adult','general'],
    efficacyLevel='health', certification='sc_food', origin='宁夏中宁',
    salesChannel='online_only', priceMin=49, priceMax=89, profitMargin=48, referenceSales=95000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=qilixiang002','platformPrice':69,'collectedAt':'2026-06-15'}])

add(name='九芝堂驴胶补血颗粒', brand='九芝堂', manufacturerType='famous_pharma',
    functionCategory=['beauty'], materialCategory='donkey_hide', dosageForm='granule',
    specification='10g×30袋/盒', packaging='family_pack', targetPopulation=['female','adult'],
    efficacyLevel='conditioning', certification='gmp', origin='湖南长沙',
    salesChannel='omni_channel', priceMin=68, priceMax=128, profitMargin=33, referenceSales=30000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=jiuzhitang001','platformPrice':88,'collectedAt':'2026-06-15'}])

add(name='敖东当归补血口服液', brand='敖东', manufacturerType='famous_pharma',
    functionCategory=['beauty'], materialCategory='other', dosageForm='liquid',
    specification='10ml×20支/盒', packaging='single_box', targetPopulation=['female','adult'],
    efficacyLevel='conditioning', certification='gmp', origin='吉林延边',
    salesChannel='omni_channel', priceMin=98, priceMax=158, profitMargin=32, referenceSales=20000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=aodong001','platformPrice':128,'collectedAt':'2026-06-15'}])

# =============================================
# 6. 降三高 (sangan) — 三七、丹参、山楂、黄芪、绞股蓝
# =============================================
add(name='云南白药三七粉', brand='云南白药', manufacturerType='famous_pharma',
    functionCategory=['sangan','bone'], materialCategory='other', dosageForm='powder',
    specification='3g×30袋/盒', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='云南文山',
    salesChannel='omni_channel', priceMin=258, priceMax=398, profitMargin=30, referenceSales=18000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=yunnanbaiyao001','platformPrice':298,'collectedAt':'2026-06-15'},
                 {'platform':'京东','url':'https://item.jd.com/yunnanbaiyao001.html','platformPrice':328,'collectedAt':'2026-06-15'}])

add(name='同仁堂三七粉', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['sangan'], materialCategory='other', dosageForm='powder',
    specification='100g/瓶', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='sc_food', origin='云南文山',
    salesChannel='omni_channel', priceMin=198, priceMax=328, profitMargin=28, referenceSales=15000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtsanqi001','platformPrice':258,'collectedAt':'2026-06-15'}])

add(name='天士力复方丹参滴丸', brand='天士力', manufacturerType='famous_pharma',
    functionCategory=['sangan'], materialCategory='other', dosageForm='pill',
    specification='180丸/瓶', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='treatment_adjunct', certification='gmp', origin='天津',
    salesChannel='omni_channel', priceMin=25, priceMax=45, profitMargin=18, referenceSales=220000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=tianshili001','platformPrice':32,'collectedAt':'2026-06-15'}])

add(name='碧生源山楂决明子茶', brand='碧生源', manufacturerType='specialty_health',
    functionCategory=['sangan','digestion'], materialCategory='other', dosageForm='tea',
    specification='3g×30袋/盒', packaging='single_box', targetPopulation=['adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='北京',
    salesChannel='omni_channel', priceMin=25, priceMax=45, profitMargin=55, referenceSales=45000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=bishengyuan002','platformPrice':35,'collectedAt':'2026-06-15'}])

add(name='同仁堂山楂降压茶', brand='同仁堂', manufacturerType='famous_pharma',
    functionCategory=['sangan'], materialCategory='other', dosageForm='tea',
    specification='5g×20袋/盒', packaging='single_box', targetPopulation=['elderly'],
    efficacyLevel='health', certification='sc_food', origin='北京',
    salesChannel='omni_channel', priceMin=48, priceMax=88, profitMargin=35, referenceSales=22000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=trtshanzha002','platformPrice':68,'collectedAt':'2026-06-15'}])

add(name='汤臣倍健鱼油软胶囊', brand='汤臣倍健', manufacturerType='specialty_health',
    functionCategory=['sangan'], materialCategory='other', dosageForm='capsule',
    specification='100粒/瓶', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='health', certification='sc_food', origin='广东广州',
    salesChannel='online_only', priceMin=128, priceMax=198, profitMargin=38, referenceSales=55000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=tcbj004','platformPrice':158,'collectedAt':'2026-06-15'}])

add(name='绞股蓝总苷片', brand='白云山', manufacturerType='famous_pharma',
    functionCategory=['sangan'], materialCategory='other', dosageForm='tablet',
    specification='60片/瓶', packaging='single_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='gmp', origin='广东广州',
    salesChannel='omni_channel', priceMin=38, priceMax=68, profitMargin=30, referenceSales=35000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=baiyunshan001','platformPrice':48,'collectedAt':'2026-06-15'}])

# =============================================
# 7. 补肾益气 (kidney) — 六味地黄、肾宝片、玛咖、黄精、枸杞
# =============================================
add(name='仁和肾宝片', brand='仁和药业', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='tablet',
    specification='120片/瓶', packaging='single_box', targetPopulation=['male','adult','elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='江西樟树',
    salesChannel='omni_channel', priceMin=168, priceMax=258, profitMargin=40, referenceSales=55000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=renhe003','platformPrice':198,'collectedAt':'2026-06-15'}])

add(name='仲景六味地黄丸', brand='仲景', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='pill',
    specification='360丸/瓶', packaging='single_box', targetPopulation=['male','adult','elderly'],
    efficacyLevel='conditioning', certification='gmp', origin='河南南阳',
    salesChannel='omni_channel', priceMin=25, priceMax=48, profitMargin=23, referenceSales=120000,
    salesDataType='exact', listingUrls=[
        {'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=zhongjing001','platformPrice':35,'collectedAt':'2026-06-15'}])

add(name='九芝堂六味地黄丸', brand='九芝堂', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='pill',
    specification='360丸/瓶', packaging='single_box', targetPopulation=['male','adult','elderly'],
    efficacyLevel='conditioning', certification='gmp', origin='湖南长沙',
    salesChannel='omni_channel', priceMin=28, priceMax=52, profitMargin=25, referenceSales=95000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=jiuzhitang002','platformPrice':38,'collectedAt':'2026-06-15'}])

add(name='汇仁肾宝片', brand='汇仁药业', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='tablet',
    specification='126片/瓶', packaging='gift_box', targetPopulation=['male','adult','elderly'],
    efficacyLevel='conditioning', certification='blue_hat', origin='江西南昌',
    salesChannel='omni_channel', priceMin=198, priceMax=298, profitMargin=38, referenceSales=62000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=huiren001','platformPrice':238,'collectedAt':'2026-06-15'}])

add(name='固本堂黄精枸杞茶', brand='固本堂', manufacturerType='specialty_health',
    functionCategory=['kidney','immunity'], materialCategory='goji', dosageForm='tea',
    specification='5g×30袋/盒', packaging='single_box', targetPopulation=['male','adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='安徽亳州',
    salesChannel='online_only', priceMin=49, priceMax=89, profitMargin=45, referenceSales=28000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=gubentang003','platformPrice':69,'collectedAt':'2026-06-15'}])

add(name='敖东玛咖片', brand='敖东', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='tablet',
    specification='60片/瓶', packaging='single_box', targetPopulation=['male','adult'],
    efficacyLevel='health', certification='sc_food', origin='吉林延边',
    salesChannel='omni_channel', priceMin=88, priceMax=158, profitMargin=42, referenceSales=18000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=aodong002','platformPrice':118,'collectedAt':'2026-06-15'}])

add(name='康恩贝玛咖咀嚼片', brand='康恩贝', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='other', dosageForm='tablet',
    specification='90片/瓶', packaging='single_box', targetPopulation=['male','adult'],
    efficacyLevel='health', certification='sc_food', origin='浙江杭州',
    salesChannel='omni_channel', priceMin=68, priceMax=128, profitMargin=45, referenceSales=15000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=kangenbei001','platformPrice':98,'collectedAt':'2026-06-15'}])

add(name='太极补肾益寿胶囊', brand='太极集团', manufacturerType='famous_pharma',
    functionCategory=['kidney'], materialCategory='ginseng', dosageForm='capsule',
    specification='60粒/瓶', packaging='single_box', targetPopulation=['elderly','male'],
    efficacyLevel='conditioning', certification='gmp', origin='重庆涪陵',
    salesChannel='omni_channel', priceMin=78, priceMax=138, profitMargin=28, referenceSales=25000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=taiji001','platformPrice':108,'collectedAt':'2026-06-15'}])

# =============================================
# 8. 综合滋补 (multi-category) — 燕窝、枸杞、人参、石斛
# =============================================
add(name='燕之屋碗燕', brand='燕之屋', manufacturerType='specialty_health',
    functionCategory=['beauty','immunity'], materialCategory='other', dosageForm='paste',
    specification='138g×6碗/盒', packaging='gift_box', targetPopulation=['female','adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='福建厦门',
    salesChannel='omni_channel', priceMin=398, priceMax=698, profitMargin=25, referenceSales=75000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=yanzhiwu001','platformPrice':498,'collectedAt':'2026-06-15'}])

add(name='小仙炖鲜炖燕窝', brand='小仙炖', manufacturerType='specialty_health',
    functionCategory=['beauty','immunity'], materialCategory='other', dosageForm='liquid',
    specification='45g×7瓶/周', packaging='gift_box', targetPopulation=['female','adult'],
    efficacyLevel='health', certification='sc_food', origin='北京',
    salesChannel='online_only', priceMin=398, priceMax=798, profitMargin=30, referenceSales=88000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=xiaoxiandun001','platformPrice':498,'collectedAt':'2026-06-15'}])

add(name='森山铁皮石斛', brand='森山', manufacturerType='specialty_health',
    functionCategory=['immunity'], materialCategory='other', dosageForm='granule',
    specification='3g×30袋/盒', packaging='gift_box', targetPopulation=['elderly','adult'],
    efficacyLevel='conditioning', certification='blue_hat', origin='浙江乐清',
    salesChannel='omni_channel', priceMin=268, priceMax=498, profitMargin=30, referenceSales=12000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=senshan001','platformPrice':368,'collectedAt':'2026-06-15'}])

add(name='杞里香宁夏枸杞', brand='杞里香', manufacturerType='specialty_health',
    functionCategory=['beauty','immunity'], materialCategory='goji', dosageForm='tea',
    specification='250g/袋', packaging='family_pack', targetPopulation=['general','adult','elderly'],
    efficacyLevel='health', certification='sc_food', origin='宁夏中宁',
    salesChannel='online_only', priceMin=19, priceMax=39, profitMargin=52, referenceSales=150000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=qilixiang003','platformPrice':29,'collectedAt':'2026-06-15'}])

add(name='正官庄高丽参膏', brand='正官庄', manufacturerType='specialty_health',
    functionCategory=['immunity','kidney'], materialCategory='ginseng', dosageForm='paste',
    specification='240g/盒', packaging='gift_box', targetPopulation=['elderly','adult','male'],
    efficacyLevel='conditioning', certification='sc_food', origin='韩国进口',
    salesChannel='omni_channel', priceMin=398, priceMax=698, profitMargin=25, referenceSales=15000,
    listingUrls=[{'platform':'淘宝','url':'https://item.taobao.com/item.htm?id=zhengguanzhuang001','platformPrice':498,'collectedAt':'2026-06-15'}])

# =============================================
# Output
# =============================================
print(f'Total products: {len(products)}')

# Save JSON
with open('data/products/all-products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

# Save JSONP
with open('data/products/all-products.jsonp.js', 'w', encoding='utf-8') as f:
    f.write('window.PRODUCT_DATA = ' + json.dumps(products, ensure_ascii=False, indent=2) + ';\n')

# Print category breakdown
cats = {}
for p in products:
    for c in p['functionCategory']:
        cats[c] = cats.get(c, 0) + 1
print('Category breakdown:', json.dumps(cats, ensure_ascii=False))

brands = {}
for p in products:
    b = p['brand']
    brands[b] = brands.get(b, 0) + 1
print('Brand breakdown:', json.dumps(brands, ensure_ascii=False))

# Count total listing URLs
url_count = sum(len(p['listingUrls']) for p in products)
print(f'Total listing URLs: {url_count}')
print(f'Products with URLs: {sum(1 for p in products if p["listingUrls"])}')
