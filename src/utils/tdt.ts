// src/utils/tdt.ts
const TDT_KEYS: string[] = ['068c912f59b293968a53ee8d4ca02ede', '068c912f59b293968a53ee8d4ca02ede']

export interface TdtStyle {
  version: 8
  sources: Record<string, unknown>
  layers: Array<unknown>
}

/**
 * 获取随机 Token
 */
const getRandomToken = (): string => {
  const index = Math.floor(Math.random() * TDT_KEYS.length)
  return TDT_KEYS[index]
}

/**
 * 获取天地图 WMTS 服务地址
 * 使用 t0-t7 随机子域名和随机 Token 降低 429 风险
 * @param type 服务类型：vec(矢量), cva(矢量注记), img(影像), cia(影像注记)
 */
export const getTdtUrls = (type: string): string[] => {
  const domains = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']
  // MapLibre 支持传入多个 URL 数组，它会自动在这些 URL 间做负载均衡
  return domains.map((d) => {
    const tk = getRandomToken()
    return `https://${d}.tianditu.gov.cn/${type}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${type}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk=${tk}`
  })
}

/**
 * 生成完整的 MapLibre Style 对象
 * 默认包含：影像底图 + 影像注记
 */
export const getTdtStyle = (): TdtStyle => {
  return {
    version: 8 as const,
    sources: {
      // 影像底图 (Satellite)
      'tdt-img': {
        type: 'raster',
        tiles: getTdtUrls('img'),
        tileSize: 512,
      },
      // 影像注记 (Roads & Labels)
      'tdt-cia': {
        type: 'raster',
        tiles: getTdtUrls('cia'),
        tileSize: 512,
      },
    },
    layers: [
      {
        id: 'tdt-img-layer',
        type: 'raster',
        source: 'tdt-img',
        paint: { 'raster-opacity': 1 },
      },
      {
        id: 'tdt-cia-layer',
        type: 'raster',
        source: 'tdt-cia',
        paint: { 'raster-opacity': 1 },
      },
    ],
  }
}
