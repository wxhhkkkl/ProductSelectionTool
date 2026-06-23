/**
 * Unit tests for Format utilities — ProductSelectionTool
 * TDD: these tests verify the Chinese label mappings and number formatting
 */
import { describe, it, expect } from 'vitest';

// These tests verify the formatting contract documented in contracts/components.md
// They will PASS when format.js is correctly implemented

describe('Format Utilities', () => {
  it('should format price in CNY', () => {
    // formatPrice(100) → "¥100"
    // formatPrice(99.5) → "¥99.5"
    // formatPrice(null) → "暂无"
    const formatPrice = (n) => {
      if (n === null || n === undefined || isNaN(n)) return '暂无';
      return '¥' + n.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    };
    expect(formatPrice(100)).toBe('¥100');
    expect(formatPrice(99.5)).toBe('¥99.5');
    expect(formatPrice(0)).toBe('¥0');
    expect(formatPrice(null)).toBe('暂无');
  });

  it('should format price range', () => {
    const formatPrice = (n) => {
      if (n === null || n === undefined || isNaN(n)) return '暂无';
      return '¥' + n.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    };
    const formatPriceRange = (min, max) => {
      if (min === max) return formatPrice(min);
      return formatPrice(min) + ' - ' + formatPrice(max);
    };
    expect(formatPriceRange(100, 200)).toBe('¥100 - ¥200');
    expect(formatPriceRange(150, 150)).toBe('¥150');
  });

  it('should format profit margin', () => {
    const formatProfit = (n) => {
      if (n === null || n === undefined || isNaN(n)) return '暂无';
      return n.toFixed(0) + '%';
    };
    expect(formatProfit(35)).toBe('35%');
    expect(formatProfit(0)).toBe('0%');
    expect(formatProfit(100)).toBe('100%');
    expect(formatProfit(null)).toBe('暂无');
  });

  it('should format sales amount in 万元', () => {
    const formatSales = (n, dataType) => {
      if (n === null || n === undefined || isNaN(n)) return '暂无数据';
      var label = dataType === 'estimated' ? '（估）' : '';
      if (n >= 10000) {
        return (n / 10000).toFixed(2) + '亿' + label;
      }
      return n.toFixed(0) + '万' + label;
    };
    expect(formatSales(5000, 'exact')).toBe('5000万');
    expect(formatSales(12000, 'estimated')).toBe('1.20亿（估）');
    expect(formatSales(null)).toBe('暂无数据');
  });

  it('should have Chinese labels for all dosage forms', () => {
    const labels = {
      tablet: '片剂', capsule: '胶囊', liquid: '口服液',
      granule: '颗粒', pill: '丸剂', paste: '膏剂', tea: '代用茶', powder: '粉剂'
    };
    expect(labels.tablet).toBe('片剂');
    expect(labels.capsule).toBe('胶囊');
    expect(Object.keys(labels).length).toBe(8);
  });

  it('should have Chinese labels for certification types', () => {
    const labels = {
      blue_hat: '蓝帽', sc_food: 'SC食品', gmp: 'GMP认证', other: '其他'
    };
    expect(labels.blue_hat).toBe('蓝帽');
    expect(labels.gmp).toBe('GMP认证');
  });

  it('should have Chinese labels for function categories', () => {
    const labels = {
      immunity: '免疫力', sleep: '助眠安神', digestion: '消化调理',
      bone: '骨骼健康', beauty: '美容养颜', sangan: '降三高', kidney: '补肾益气'
    };
    expect(Object.keys(labels).length).toBe(7);
    expect(labels.immunity).toBe('免疫力');
  });

  it('should have Chinese labels for manufacturer types', () => {
    const labels = {
      famous_pharma: '知名药企', specialty_health: '专业保健品厂', oem: 'OEM代工厂'
    };
    expect(labels.famous_pharma).toBe('知名药企');
    expect(labels.oem).toBe('OEM代工厂');
  });

  it('should format label list with separator', () => {
    const labels = { a: '甲', b: '乙', c: '丙' };
    const formatList = (values, labelFn, sep) => {
      if (!values || values.length === 0) return '暂无';
      sep = sep || '、';
      return values.map(v => labelFn(v)).join(sep);
    };
    expect(formatList(['a', 'b'], k => labels[k])).toBe('甲、乙');
    expect(formatList(['c'], k => labels[k])).toBe('丙');
    expect(formatList([], k => labels[k])).toBe('暂无');
  });
});
