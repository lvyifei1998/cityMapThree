<template>
  <div class="page">
    <!-- 左侧操作栏 -->
    <aside class="sidebar">
      <div class="sidebar-title">地下管线系统</div>

      <!-- 透明度 -->
      <section class="panel">
        <div class="panel-label">地表透明度</div>
        <div class="row">
          <input type="range" min="0" max="1" step="0.05" v-model.number="opacity" @input="onOpacityChange" />
          <span class="val">{{ Math.round(opacity * 100) }}%</span>
        </div>
      </section>

      <!-- 添加节点 -->
      <section class="panel">
        <div class="panel-label">添加节点</div>
        <button :class="['btn', pickMode === 'node' ? 'btn-active' : '']" @click="toggleMode('node')">
          {{ pickMode === 'node' ? '🔴 取消拾取' : '📍 点击地图拾取坐标' }}
        </button>
        <div v-if="newNode.lng" class="coord-preview">{{ newNode.lng.toFixed(5) }}, {{ newNode.lat.toFixed(5) }}</div>
        <label>埋深 (m)<input type="number" v-model.number="newNode.depth" min="0" step="0.5" /></label>
        <button class="btn btn-primary" :disabled="!newNode.lng" @click="addNode">添加节点</button>
      </section>

      <!-- 添加管线 -->
      <section class="panel">
        <div class="panel-label">添加管线</div>
        <label>起点节点
          <select v-model="newPipe.startNodeId">
            <option value="">-- 选择 --</option>
            <option v-for="n in project.nodes" :key="n.id" :value="n.id">{{ n.id }} ({{ n.lng.toFixed(4) }},{{
              n.lat.toFixed(4) }})</option>
          </select>
        </label>
        <label>终点节点
          <select v-model="newPipe.endNodeId">
            <option value="">-- 选择 --</option>
            <option v-for="n in project.nodes" :key="n.id" :value="n.id">{{ n.id }} ({{ n.lng.toFixed(4) }},{{
              n.lat.toFixed(4) }})</option>
          </select>
        </label>
        <label>管径 (m)<input type="number" v-model.number="newPipe.radius" min="0.05" step="0.05" /></label>
        <label>材质类型
          <select v-model="newPipe.material">
            <option value="electric">电力（红）</option>
            <option value="water">给水（蓝）</option>
            <option value="gas">燃气（黄）</option>
          </select>
        </label>
        <button class="btn btn-primary"
          :disabled="!newPipe.startNodeId || !newPipe.endNodeId || newPipe.startNodeId === newPipe.endNodeId"
          @click="addPipeline">生成管线</button>
      </section>

      <!-- 井盖 -->
      <section class="panel">
        <div class="panel-label">添加井盖</div>
        <label>选择管线
          <select v-model="newManhole.pipelineId">
            <option value="">-- 选择管线 --</option>
            <option v-for="p in project.pipelines" :key="p.id" :value="p.id">
              {{ MATERIAL_LABEL[p.material] }}-{{ p.id }}
            </option>
          </select>
        </label>
        <label>位置 (0=起点 1=终点)
          <input type="number" v-model.number="newManhole.t" min="0" max="1" step="0.1" />
        </label>
        <label>标注名称<input type="text" v-model="newManhole.label" placeholder="如：1号井" /></label>
        <button class="btn btn-primary" :disabled="!newManhole.pipelineId" @click="addManhole">添加井盖</button>
        <div class="panel-label" style="margin-top:4px">井盖列表</div>
        <div v-for="m in project.manholes" :key="m.id" class="list-item">
          <span>🔘</span> {{ m.label || m.id }}
          <span class="sub">管线{{ m.pipelineId }} t={{ m.t }}</span>
          <button class="del-btn" @click="deleteManhole(m.id)">✕</button>
        </div>
        <div v-if="!project.manholes.length" class="empty">暂无井盖</div>
      </section>

      <!-- 横截面 -->
      <section class="panel">
        <div class="panel-label">横截面分析</div>
        <button :class="['btn', pickMode === 'section' ? 'btn-active' : '']" @click="toggleMode('section')">
          {{ pickMode === 'section' ? `🔴 取消（已选${sectionPoints.length}点）` : '✂️ 绘制截面线' }}
        </button>
        <div v-if="sectionPoints.length === 1" class="coord-preview">第1点已选，再点一次完成</div>
        <button v-if="sectionPoints.length === 2" class="btn btn-primary" @click="computeSection">分析截面</button>
        <button v-if="sectionPoints.length" class="btn" @click="clearSection">清除截面线</button>
      </section>

      <!-- 管线列表 -->
      <section class="panel list-panel">
        <div class="panel-label">管线列表 ({{ project.pipelines.length }})</div>
        <div v-for="p in project.pipelines" :key="p.id" class="list-item">
          <span :class="['dot', p.material]"></span>
          {{ MATERIAL_LABEL[p.material] }} r={{ p.radius }}m
          <button class="del-btn" @click="deletePipeline(p.id)">✕</button>
        </div>
        <div v-if="!project.pipelines.length" class="empty">暂无管线</div>
      </section>

      <button class="btn btn-danger" @click="clearAll">清空所有数据</button>
    </aside>

    <!-- 地图 -->
    <div id="map-view"></div>

    <!-- 横截面弹窗 -->
    <div v-if="sectionResult.show" class="modal-mask" @click.self="sectionResult.show = false">
      <div class="modal">
        <div class="modal-header">
          横截面分析结果
          <button class="del-btn" @click="sectionResult.show = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!sectionResult.items.length" class="empty">截面线未与任何管线相交</div>
          <div v-else>
            <p class="section-hint">共 {{ sectionResult.items.length }} 条管线穿越截面</p>
            <div class="section-canvas-wrap">
              <!-- SVG 横截面示意图 -->
              <svg :width="sectionSvgSize" :height="sectionSvgSize" class="section-svg">
                <!-- 地面线 -->
                <line :x1="0" :y1="sectionSvgSize * 0.15" :x2="sectionSvgSize" :y2="sectionSvgSize * 0.15"
                  stroke="#3fb950" stroke-width="2" stroke-dasharray="6,3" />
                <text x="4" :y="sectionSvgSize * 0.15 - 4" fill="#3fb950" font-size="11">地面</text>
                <!-- 管线圆圈 -->
                <g v-for="item in sectionResult.items" :key="item.pipeId">
                  <circle :cx="item.svgX" :cy="item.svgY" :r="item.svgR" :fill="item.colorHex" fill-opacity="0.7"
                    :stroke="item.colorHex" stroke-width="1.5" />
                  <text :x="item.svgX" :y="item.svgY + 4" text-anchor="middle" fill="#fff" font-size="9">{{ item.label
                    }}</text>
                </g>
              </svg>
            </div>
            <!-- 表格 -->
            <table class="section-table">
              <thead>
                <tr>
                  <th>管线</th>
                  <th>类型</th>
                  <th>管径</th>
                  <th>埋深</th>
                  <th>水平偏移</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in sectionResult.items" :key="item.pipeId">
                  <td><span :class="['dot', item.material]"></span> {{ item.pipeId }}</td>
                  <td>{{ MATERIAL_LABEL[item.material] }}</td>
                  <td>{{ (item.radius * 2).toFixed(2) }}m</td>
                  <td>{{ item.depth.toFixed(2) }}m</td>
                  <td>{{ item.offset.toFixed(2) }}m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import maplibregl, { type Map as MaplibreMap, type CustomLayerInterface, type LngLat } from 'maplibre-gl'
import * as THREE from 'three'
import { getTdtStyle } from '@/utils/tdt'
import {
  loadProject, saveProject, generateId,
  MATERIAL_COLOR, MATERIAL_EMISSIVE, MATERIAL_LABEL,
  type PipelineProject, type PipelineMaterial, type PipelineNode, type Pipeline, type Manhole
} from '@/utils/pipeline'
import 'maplibre-gl/dist/maplibre-gl.css'

type PickMode = '' | 'node' | 'section'

const opacity = ref(1)
const pickMode = ref<PickMode>('')
const project = reactive<PipelineProject>(loadProject())

const newNode = reactive({ lng: 0, lat: 0, depth: 1.5 })
const newPipe = reactive({ startNodeId: '', endNodeId: '', radius: 0.15, material: 'water' as PipelineMaterial })
const newManhole = reactive({ pipelineId: '', t: 0.5, label: '' })

const sectionPoints = reactive<LngLat[]>([])
const sectionResult = reactive<{
  show: boolean
  items: Array<{
    pipeId: string
    material: PipelineMaterial
    radius: number
    depth: number
    offset: number
    colorHex: string
    label: string
    svgX: number
    svgY: number
    svgR: number
  }>
}>({ show: false, items: [] })

const sectionSvgSize = 400

let map: MaplibreMap
let threeScene: THREE.Scene
let threeCamera: THREE.Camera
let threeRenderer: THREE.WebGLRenderer
let originMC: maplibregl.MercatorCoordinate
let meterScale: number

const meshMap = new Map<string, THREE.Object3D[]>()
const manholeMeshMap = new Map<string, THREE.Object3D>()
let sectionLineLayer: maplibregl.GeoJSONSource | null = null

function mcToLocal(lng: number, lat: number, depth: number): THREE.Vector3 {
  const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], -depth)
  return new THREE.Vector3(
    (mc.x - originMC.x) / meterScale,
    -(mc.y - originMC.y) / meterScale,
    (mc.z! - (originMC.z ?? 0)) / meterScale
  )
}

function buildPipeMesh(start: PipelineNode, end: PipelineNode, radius: number, material: PipelineMaterial): THREE.Object3D[] {
  const objects: THREE.Object3D[] = []
  const mat = new THREE.MeshStandardMaterial({
    color: MATERIAL_COLOR[material],
    emissive: MATERIAL_EMISSIVE[material],
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.6,
  })

  const A = mcToLocal(start.lng, start.lat, start.depth)
  const B = mcToLocal(end.lng, end.lat, end.depth)
  const dir = new THREE.Vector3().subVectors(B, A)
  const length = dir.length()
  const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5)

  const geo = new THREE.CylinderGeometry(radius, radius, length, 16)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(mid)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  mesh.frustumCulled = false
  objects.push(mesh)

  for (const pos of [A, B]) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 12), mat.clone())
    sphere.position.copy(pos)
    sphere.frustumCulled = false
    objects.push(sphere)
  }

  return objects
}

function buildManholeMesh(manhole: Manhole, pipe: Pipeline, start: PipelineNode, end: PipelineNode): THREE.Object3D {
  const A = mcToLocal(start.lng, start.lat, start.depth)
  const B = mcToLocal(end.lng, end.lat, end.depth)
  const pos = new THREE.Vector3().lerpVectors(A, B, manhole.t)

  const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16)
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(pos)
  mesh.position.z = 0
  mesh.frustumCulled = false
  return mesh
}

function rebuildScene() {
  if (!threeScene) return

  for (const objs of meshMap.values()) objs.forEach(o => threeScene.remove(o))
  meshMap.clear()
  for (const obj of manholeMeshMap.values()) threeScene.remove(obj)
  manholeMeshMap.clear()

  const nodeMap = new Map(project.nodes.map(n => [n.id, n]))
  const pipeMap = new Map(project.pipelines.map(p => [p.id, p]))

  for (const pipe of project.pipelines) {
    const start = nodeMap.get(pipe.startNodeId)
    const end = nodeMap.get(pipe.endNodeId)
    if (!start || !end) continue
    const objs = buildPipeMesh(start, end, pipe.radius, pipe.material)
    objs.forEach(o => threeScene.add(o))
    meshMap.set(pipe.id, objs)
  }

  for (const manhole of project.manholes) {
    const pipe = pipeMap.get(manhole.pipelineId)
    if (!pipe) continue
    const start = nodeMap.get(pipe.startNodeId)
    const end = nodeMap.get(pipe.endNodeId)
    if (!start || !end) continue
    const obj = buildManholeMesh(manhole, pipe, start, end)
    threeScene.add(obj)
    manholeMeshMap.set(manhole.id, obj)
  }

  map?.triggerRepaint()
}

function onOpacityChange() {
  if (!map) return
  map.setPaintProperty('tdt-img-layer', 'raster-opacity', opacity.value)
  map.setPaintProperty('tdt-cia-layer', 'raster-opacity', opacity.value)
}

function toggleMode(mode: PickMode) {
  if (pickMode.value === mode) {
    pickMode.value = ''
    map.getCanvas().style.cursor = ''
  } else {
    pickMode.value = mode
    map.getCanvas().style.cursor = 'crosshair'
    if (mode === 'section') {
      sectionPoints.splice(0)
      updateSectionLine()
    }
  }
}

function onMapClick(e: maplibregl.MapMouseEvent) {
  if (pickMode.value === 'node') {
    newNode.lng = e.lngLat.lng
    newNode.lat = e.lngLat.lat
    pickMode.value = ''
    map.getCanvas().style.cursor = ''
  } else if (pickMode.value === 'section') {
    sectionPoints.push(e.lngLat)
    updateSectionLine()
    if (sectionPoints.length === 2) {
      pickMode.value = ''
      map.getCanvas().style.cursor = ''
    }
  }
}

function updateSectionLine() {
  if (!map || !sectionLineLayer) return
  const coords = sectionPoints.map(p => [p.lng, p.lat])
  sectionLineLayer.setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {}
  })
}

function clearSection() {
  sectionPoints.splice(0)
  updateSectionLine()
  sectionResult.show = false
}

function computeSection() {
  if (sectionPoints.length !== 2) return

  const p1 = sectionPoints[0]!
  const p2 = sectionPoints[1]!
  const nodeMap = new Map(project.nodes.map(n => [n.id, n]))
  const items: typeof sectionResult.items = []

  for (const pipe of project.pipelines) {
    const start = nodeMap.get(pipe.startNodeId)
    const end = nodeMap.get(pipe.endNodeId)
    if (!start || !end) continue

    const intersect = lineSegmentIntersect2D(
      p1.lng, p1.lat, p2.lng, p2.lat,
      start.lng, start.lat, end.lng, end.lat
    )
    if (!intersect) continue

    const t = intersect.t2
    const depth = start.depth + (end.depth - start.depth) * t
    const offset = intersect.distFromP1

    items.push({
      pipeId: pipe.id,
      material: pipe.material,
      radius: pipe.radius,
      depth,
      offset,
      colorHex: '#' + MATERIAL_COLOR[pipe.material].toString(16).padStart(6, '0'),
      label: MATERIAL_LABEL[pipe.material].slice(0, 2),
      svgX: 0,
      svgY: 0,
      svgR: 0,
    })
  }

  items.sort((a, b) => a.offset - b.offset)

  const maxDepth = Math.max(...items.map(i => i.depth + i.radius), 5)
  const totalWidth = items.length > 0 ? Math.max(...items.map(i => Math.abs(i.offset))) * 2 + 10 : 10
  const scaleX = (sectionSvgSize * 0.9) / totalWidth
  const scaleY = (sectionSvgSize * 0.7) / maxDepth

  for (const item of items) {
    item.svgX = sectionSvgSize / 2 + item.offset * scaleX
    item.svgY = sectionSvgSize * 0.15 + item.depth * scaleY
    item.svgR = item.radius * Math.min(scaleX, scaleY)
  }

  sectionResult.items = items
  sectionResult.show = true
}

function lineSegmentIntersect2D(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): { t1: number; t2: number; distFromP1: number } | null {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (Math.abs(denom) < 1e-10) return null

  const t1 = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom
  const t2 = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom

  if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) return null

  const ix = ax + t1 * (bx - ax)
  const iy = ay + t1 * (by - ay)
  const distFromP1 = Math.sqrt((ix - ax) ** 2 + (iy - ay) ** 2) * 111000

  return { t1, t2, distFromP1 }
}

function addNode() {
  if (!newNode.lng) return
  project.nodes.push({ id: generateId(), lng: newNode.lng, lat: newNode.lat, depth: newNode.depth })
  newNode.lng = 0
  newNode.lat = 0
  saveProject(project)
}

function addPipeline() {
  if (!newPipe.startNodeId || !newPipe.endNodeId) return
  project.pipelines.push({
    id: generateId(),
    startNodeId: newPipe.startNodeId,
    endNodeId: newPipe.endNodeId,
    radius: newPipe.radius,
    material: newPipe.material,
  })
  newPipe.startNodeId = ''
  newPipe.endNodeId = ''
  saveProject(project)
  rebuildScene()
}

function addManhole() {
  if (!newManhole.pipelineId) return
  project.manholes.push({
    id: generateId(),
    label: newManhole.label || '井盖',
    pipelineId: newManhole.pipelineId,
    t: newManhole.t,
  })
  newManhole.pipelineId = ''
  newManhole.label = ''
  saveProject(project)
  rebuildScene()
}

function deletePipeline(id: string) {
  const idx = project.pipelines.findIndex(p => p.id === id)
  if (idx !== -1) project.pipelines.splice(idx, 1)
  project.manholes = project.manholes.filter(m => m.pipelineId !== id)
  saveProject(project)
  rebuildScene()
}

function deleteManhole(id: string) {
  const idx = project.manholes.findIndex(m => m.id === id)
  if (idx !== -1) project.manholes.splice(idx, 1)
  saveProject(project)
  rebuildScene()
}

function clearAll() {
  project.nodes.splice(0)
  project.pipelines.splice(0)
  project.manholes.splice(0)
  saveProject(project)
  rebuildScene()
}

onMounted(() => {
  const NJ_CENTER: [number, number] = [118.7966, 32.0593]



  const mapOptions = Object.assign(
    {
      container: 'map-view',
      style: getTdtStyle() as unknown as maplibregl.StyleSpecification,
      center: NJ_CENTER,
      zoom: 15,
      pitch: 60,
    },
    { antialias: true } // antialias not in MapOptions type but supported at runtime
  )
  const map_ = new maplibregl.Map(mapOptions)
  map = map_

  map.on('click', onMapClick)

  originMC = maplibregl.MercatorCoordinate.fromLngLat(NJ_CENTER, 0)
  meterScale = originMC.meterInMercatorCoordinateUnits()

  const threeLayer: CustomLayerInterface = {
    id: 'three-pipeline-layer',
    type: 'custom',
    renderingMode: '3d',

    onAdd(_m: MaplibreMap, gl: WebGLRenderingContext) {
      threeCamera = new THREE.Camera()
      threeScene = new THREE.Scene()

      const ambient = new THREE.AmbientLight(0xffffff, 0.8)
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
      dirLight.position.set(100, 200, 100)
      threeScene.add(ambient, dirLight)

      threeRenderer = new THREE.WebGLRenderer({
        canvas: gl.canvas as HTMLCanvasElement,
        context: gl,
        antialias: true,
        alpha: true,
      })
      threeRenderer.autoClear = false

      rebuildScene()
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(_gl: WebGLRenderingContext, args: any) {
      const rawMatrix: number[] = Array.isArray(args)
        ? args
        : (args?.defaultProjectionData?.mainMatrix ?? Object.values(args))

      const transform = new THREE.Matrix4().fromArray(rawMatrix)
      const translation = new THREE.Matrix4().makeTranslation(originMC.x, originMC.y, originMC.z ?? 0)
      const scale = new THREE.Matrix4().makeScale(meterScale, -meterScale, meterScale)

      threeCamera.projectionMatrix = transform.multiply(translation).multiply(scale)
      threeCamera.projectionMatrixInverse.copy(threeCamera.projectionMatrix).invert()

      threeRenderer.resetState()
      threeRenderer.render(threeScene, threeCamera)
      map.triggerRepaint()
    },
  }

  map.on('style.load', () => {
    map.addLayer(threeLayer)

    map.addSource('section-line', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
    })
    map.addLayer({
      id: 'section-line-layer',
      type: 'line',
      source: 'section-line',
      paint: { 'line-color': '#ff0000', 'line-width': 3, 'line-dasharray': [2, 2] }
    })
    sectionLineLayer = map.getSource('section-line') as maplibregl.GeoJSONSource
  })
})

onUnmounted(() => {
  map?.remove()
})
</script>
<style scoped>
.page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 270px;
  flex-shrink: 0;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 10px;
  overflow-y: auto;
  z-index: 10;
  font-size: 13px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 700;
  color: #58a6ff;
  padding-bottom: 8px;
  border-bottom: 1px solid #21262d;
  margin-bottom: 4px;
}

.panel {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-label {
  font-size: 11px;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.val {
  font-size: 11px;
  color: #8b949e;
  min-width: 32px;
  text-align: right;
}

.coord-preview {
  font-size: 11px;
  color: #3fb950;
  background: #0d1117;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #21262d;
}

.sub {
  font-size: 10px;
  color: #8b949e;
  margin-left: 4px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #c9d1d9;
  font-size: 12px;
}

input[type='number'],
input[type='text'],
select {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  color: #e6edf3;
  padding: 4px 6px;
  font-size: 12px;
  outline: none;
}

input[type='range'] {
  flex: 1;
  accent-color: #58a6ff;
}

.btn {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid #30363d;
  background: #21262d;
  color: #c9d1d9;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}

.btn:hover {
  background: #30363d;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-active {
  background: #3d1f1f;
  border-color: #f85149;
  color: #f85149;
}

.btn-primary {
  background: #1f6feb;
  border-color: #388bfd;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #388bfd;
}

.btn-danger {
  background: #3d1f1f;
  border-color: #f85149;
  color: #f85149;
  margin-top: 4px;
}

.btn-danger:hover {
  background: #5a1e1e;
}

.list-panel {
  max-height: 160px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid #21262d;
  font-size: 12px;
}

.list-item:last-child {
  border-bottom: none;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.electric {
  background: #ff3333;
}

.dot.water {
  background: #3399ff;
}

.dot.gas {
  background: #ffcc00;
}

.del-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
}

.del-btn:hover {
  color: #f85149;
}

.empty {
  color: #8b949e;
  font-size: 12px;
  text-align: center;
  padding: 8px 0;
}

#map-view {
  flex: 1;
  height: 100%;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0d1117;
  color: #58a6ff;
  font-size: 14px;
  font-weight: 700;
  border-bottom: 1px solid #21262d;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.section-hint {
  font-size: 12px;
  color: #8b949e;
  margin-bottom: 10px;
}

.section-canvas-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.section-svg {
  background: #0d1117;
  border-radius: 6px;
  border: 1px solid #21262d;
}

.section-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: #c9d1d9;
}

.section-table th {
  background: #0d1117;
  padding: 6px 8px;
  text-align: left;
  color: #8b949e;
  font-weight: 600;
  border-bottom: 1px solid #21262d;
}

.section-table td {
  padding: 5px 8px;
  border-bottom: 1px solid #21262d;
}

.section-table tr:last-child td {
  border-bottom: none;
}
</style>
