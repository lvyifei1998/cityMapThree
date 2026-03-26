// 管线数据协议
export type PipelineMaterial = 'water' | 'electric' | 'gas'

export interface PipelineNode {
  id: string
  lng: number
  lat: number
  depth: number
}

export interface Pipeline {
  id: string
  startNodeId: string
  endNodeId: string
  radius: number
  material: PipelineMaterial
}

// 井盖：挂在某段管线上，t=0~1 表示沿管线的位置比例
export interface Manhole {
  id: string
  label: string
  pipelineId: string
  t: number
}

export interface PipelineProject {
  nodes: PipelineNode[]
  pipelines: Pipeline[]
  manholes: Manhole[]
}

const STORAGE_KEY = 'pipeline_project'

export const MATERIAL_COLOR: Record<PipelineMaterial, number> = {
  electric: 0xff3333,
  water: 0x3399ff,
  gas: 0xffcc00,
}

export const MATERIAL_EMISSIVE: Record<PipelineMaterial, number> = {
  electric: 0x550000,
  water: 0x001133,
  gas: 0x332200,
}

export const MATERIAL_LABEL: Record<PipelineMaterial, string> = {
  electric: '电力',
  water: '给水',
  gas: '燃气',
}

export function loadProject(): PipelineProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as PipelineProject
      if (!p.manholes) p.manholes = []
      return p
    }
  } catch {}
  return { nodes: [], pipelines: [], manholes: [] }
}

export function saveProject(project: PipelineProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}
