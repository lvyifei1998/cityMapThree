<template>
  <div>
    <!-- <RouterLink to="/about">MapLibre实例内容</RouterLink> -->
    <RouterView />
  </div>
</template>
<script setup lang="ts">
// import type router from './router';

// import * as Cesium from 'cesium';
// import "./Widgets/widgets.css"
// import { onMounted, ref, shallowRef, reactive } from 'vue';
// window.CESIUM_BASE_URL = '/';
// let handler = null; // 鼠标事件处理器
// let postRenderListener = null; // 场景渲染更新监听器
// // 弹窗状态管理
// const selectedVehicle = ref(null); // 当前选中的车辆业务数据
// const selectedPrimitive = shallowRef(null); // 当前选中的底图图元(Billboard)
// const popupPosition = reactive({ x: -1000, y: -1000 }); // 初始藏在屏幕外
// Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNDc3NmExZi0xNWUxLTRlYzItYmM4My01N2Q2MWI2MzA3MTMiLCJpZCI6NDA4NDUwLCJpYXQiOjE3NzQzNjQ2MDB9.vydxZxR4wPEBJexKZqgyUAu1QBd_9msr4oAI9KJCBSI'
// Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(89, 20, 110, 61)

// // import { RouterLink, RouterView } from 'vue-router'
// // import HelloWorld from './components/HelloWorld.vue'
// const computeCircle = (radius: number) => {
//   const positions = [];
//   for (let i = 0; i < 360; i += 30) {
//     const radians = Cesium.Math.toRadians(i);
//     positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
//   }
//   return positions;
// }
// onMounted(async () => {
//   const viewer = new Cesium.Viewer('cesiumContainer', {
//     infoBox: false,
//     geocoder: false,
//     homeButton: false,
//     sceneModePicker: false,
//     navigationHelpButton: false,
//     animation: false,
//     timeline: false,
//     fullscreenButton: false,
//     terrainProvider: await Cesium.createWorldTerrainAsync({
//       requestWaterMask: true,
//       requestVertexNormals: true,
//     }),

//     // imageryProvider: new Cesium.WebMapServiceImageryProvider({
//     //   url: 'http://t0.tianditu.com/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles',
//     // }),
//     // 高德矢量图

//     // imageryProvider:
//   });
//   const vehicleCollection = new Cesium.BillboardCollection({ scene: viewer.scene });
//   viewer.scene.primitives.add(vehicleCollection);
//   const instance = new Cesium.GeometryInstance({
//     geometry: new Cesium.EllipseGeometry({
//       center: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 0),
//       semiMinorAxis: 500000.0,
//       semiMajorAxis: 1000000.0,
//       rotation: Cesium.Math.PI_OVER_FOUR,
//       vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
//     }),
//     id: 'object returned when this instance is picked and to get/set per-instance attributes'
//   });
//   viewer.scene.primitives.add(new Cesium.Primitive({
//     geometryInstances: instance,
//     appearance: new Cesium.EllipsoidSurfaceAppearance({
//       material: Cesium.Material.fromType('Checkerboard')
//     })
//   }));
//   vehicleCollection.add({
//     position: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 0),
//     image: '/Assets/Images/积分.svg', // 请确保本地有这个图标，或用线上的
//     width: 32,
//     height: 32,
//     // 关键：将业务 ID 绑定在 id 属性上，拾取时会用到
//     id: { v_id: '沪A·88888', type: 'truck' }
//   });
//   viewer.camera.flyTo({
//     destination: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 2000),
//     duration: 0.5,
//   });
//   // 限制最大和最小缩放高度
//   viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500;
//   viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5000000;


//   const initPickingEvent = () => {
//     handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

//     // 监听左键点击事件
//     handler.setInputAction((clickEvent) => {
//       // 获取鼠标点击位置的物体
//       const pickedObject = viewer.scene.pick(clickEvent.position);

//       // 判断是否点中了物体，并且该物体是我们定义的货车
//       if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.type === 'truck') {

//         // 提取业务数据显示在弹窗中
//         selectedVehicle.value = pickedObject.id;
//         // 保存选中的底图对象，用于后续实时计算它的屏幕坐标
//         selectedPrimitive.value = pickedObject.primitive;

//       } else {
//         // 点到空白处，关闭弹窗
//         closePopup();
//       }
//     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
//   };
//   // 3. 实时同步 3D 坐标到 2D 屏幕坐标
//   const syncPopupPosition = () => {
//     // 注册场景的 postRender 事件：地图每一帧渲染完毕后都会执行
//     postRenderListener = viewer.scene.postRender.addEventListener(() => {
//       if (selectedVehicle.value && selectedPrimitive.value) {

//         // 获取该 Billboard 在 3D 世界中的坐标
//         const position3D = selectedPrimitive.value.position;
//         // 将 3D 坐标转换为当前屏幕的 2D 像素坐标 (x, y)
//         const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
//           viewer.scene,
//           position3D
//         );

//         console.log(position3D, viewer.scene, canvasPosition)
//         // 如果转换成功（物体在相机视野内）
//         if (Cesium.defined(canvasPosition)) {
//           // 更新 Vue 弹窗的坐标，并向上偏移一定的像素，避免遮挡图标本身
//           popupPosition.x = canvasPosition.x;
//           popupPosition.y = canvasPosition.y - 40;
//         } else {
//           // 如果物体被地球挡住或移出屏幕，可以将弹窗移出可视区
//           popupPosition.x = -1000;
//           popupPosition.y = -1000;
//         }
//       }
//     });
//   };

//   const closePopup = () => {
//     selectedVehicle.value = null;
//     selectedPrimitive.value = null;
//     popupPosition.x = -1000;
//     popupPosition.y = -1000;
//   };
// viewer.entities.add({
//   polylineVolume: {
//     positions: Cesium.Cartesian3.fromDegreesArrayHeights([
//       116.39, 39.9, -5, // 经度, 纬度, 深度(米)
//       116.40, 39.9, -8
//     ]),
//     shape: computeCircle(2), // 定义圆柱断面，参数为半径
//     material: Cesium.Color.DEEPSKYBLUE.withAlpha(0.8),
//     outline: true
//   }
// });
// const routeMap = new Map();
// const routeCollection = new Cesium.PolylineCollection();
// viewer.scene.primitives.add(routeCollection);
// const renderRoute = (routeId, coordinatesArray) => {
//   // coordinatesArray 格式示例: [[lng, lat], [lng, lat], ...]
//   const positions = Cesium.Cartesian3.fromDegreesArray(
//     coordinatesArray.flat()
//   );

//   if (routeMap.has(routeId)) {
//     // 更新现有路线
//     const polyline = routeMap.get(routeId);
//     polyline.positions = positions;
//   } else {
//     // 新增路线
//     const polyline = routeCollection.add({
//       positions: positions,
//       width: 3.0,
//       material: Cesium.Material.fromType('Color', {
//         color: Cesium.Color.fromCssColorString('#3b82f6').withAlpha(0.6)
//       }),
//       id: { r_id: routeId, type: 'route' }
//     });
//     routeMap.set(routeId, polyline);
//   }
// };
// renderRoute('route1', [
//   [116.39, 39.8],
//   [116.40, 39.9],
//   [116.41, 39.91]
// ])
// viewer.cesiumWidget.creditContainer.style.display = 'none'
// viewer.camera.flyTo({
//   destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000),
//   duration: 0.5,
// })
// 辅助函数：生成圆管断面坐标
// initPickingEvent();
// syncPopupPosition();
// })
//   // 加载高德地图
//   const gaodeImageryProvider = new Cesium.UrlTemplateImageryProvider({
//     url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
//     credit: '高德地图',
//   });
//   viewer.imageryLayers.addImageryProvider(gaodeImageryProvider)

//   // 加载高德影像地图
//   const gaodeImageryProvider2 = new Cesium.UrlTemplateImageryProvider({
//     url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
//     credit: '高德地图',
//   });
//   const layer2 = viewer.imageryLayers.addImageryProvider(gaodeImageryProvider2)
//   layer2.alpha = 0.5
//   viewer.cesiumWidget.creditContainer.style.display = 'none'
//   viewer.camera.setView({
//     destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100000),
//     orientation: {
//       heading: Cesium.Math.toRadians(0),
//       pitch: Cesium.Math.toRadians(-90),
//       roll: Cesium.Math.toRadians(0),
//     },
//   })
// viewer.camera.flyHome(3)
// viewer.camera.flyTo({
//   destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000),
//   duration: 0.5,
// })
// const point = viewer.entities.add({
//   id: 'point1',
//   position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
//   point: {
//     pixelSize: 20,
//     color: Cesium.Color.GREEN,
//     outlineColor: Cesium.Color.WHITE,
//     outlineWidth: 2,
//   },
// });
// const label = viewer.entities.add({
//   id: 'label1',
//   position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000),
//   label: {
//     text: '北京',
//     font: '20px',
//     fillColor: Cesium.Color.WHITE,
//     outlineColor: Cesium.Color.BLACK,
//     outlineWidth: 2,
//     style: Cesium.LabelStyle.FILL_AND_OUTLINE,

//   },
// });
// const logo = viewer.entities.add({
//   id: 'logo1',
//   position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
//   billboard: {
//     image: './Assets/Images/积分.svg',
//     width: 30,
//     height: 30,
//     pixelOffset: new Cesium.Cartesian2(0, -15),
//   },
// })
// const plane = viewer.entities.add({
//   id: 'plane1',
//   position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 300),
//   model: {
//     uri: './Assets/Images/avion.glb',
//     minimumPixelSize: 128,
//     maximumScale: 10,
//     silhouetteColor: Cesium.Color.WHITE,
//     silhouetteSize: 2,
//     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000),
//   },
// })
// const polyline = viewer.entities.add({
//   id: 'polyline1',
//   polyline: {
//     positions: Cesium.Cartesian3.fromDegreesArrayHeights([
//       116.39, 39.9, 100,
//       114.39, 38.9, 300,
//     ]),
//     width: 2,
//     material: Cesium.Color.RED,
//   },
// })
// const grid = new Cesium.GridMaterialProperty({
//   color: Cesium.Color.YELLOW.withAlpha(0.5),
//   cellAlpha: 0.5,
//   lineCount: new Cesium.Cartesian2(8, 8),
//   lineThickness: new Cesium.Cartesian2(8, 8),
//   fadeFactor: 1,
// })
// const image = new Cesium.ImageMaterialProperty({
//   image: './Assets/Images/积分.svg',
//   transparent: true,
//   repeat: new Cesium.Cartesian2(8, 8),
// })
// const stripe = new Cesium.StripeMaterialProperty({
//   evenColor: Cesium.Color.YELLOW.withAlpha(0.5),
//   oddColor: Cesium.Color.RED.withAlpha(0.5),
//   orientation: Cesium.StripeOrientation.VERTICAL,
//   repeat: 10,
// })
// viewer.entities.add({
//   name: 'rect',
//   rectangle: {
//     coordinates: Cesium.Rectangle.fromDegrees(116.38, 39.88, 116.40, 39.92),
//     material: stripe,
//     outline: true,
//     outlineColor: Cesium.Color.BLUE,
//     outlineWidth: 2,
//     extrudedHeight: 1000,
//     height: 200,
//   },

// })
// const RectangleGeometry = new Cesium.RectangleGeometry({
//   rectangle: Cesium.Rectangle.fromDegrees(116.38, 39.88, 116.40, 39.92),

// })
// const circleGeometry = new Cesium.CircleGeometry({
//   center: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
//   radius: 1000,
//   height: 100,
//   vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
// })
// const circleInstace = new Cesium.GeometryInstance({
//   id: 'circle',
//   geometry: circleGeometry,
//   attributes: {
//     color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GREEN.withAlpha(0.5)),
//   },
// })
// const rectInstance = new Cesium.GeometryInstance({
//   id: 'rect',
//   geometry: RectangleGeometry,
//   attributes: {
//     color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.5)),
//   },
// })
// const rectPrimitive = new Cesium.Primitive({
//   geometryInstances: [rectInstance, circleInstace],
//   appearance: new Cesium.PerInstanceColorAppearance({
//     flat: true,
//     translucent: false,
//   }),
// })
// viewer.scene.primitives.add(rectPrimitive)
// // document.querySelector('#colorChanger')?.addEventListener('click', () => {
// //   const attr = rectPrimitive.getGeometryInstanceAttributes('circle')
// //   attr.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.BLUE.withAlpha(0.5))
// // })
// const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
// handler.setInputAction((movement) => {
//   const pickedObject = viewer.scene.pick(movement.position)
//   console.log(pickedObject)
//   if (Cesium.defined(pickedObject) && pickedObject.id === 'circle') {
//     const attr = rectPrimitive.getGeometryInstanceAttributes('circle')
//     attr.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.BLUE.withAlpha(0.5))
//   }
// }, Cesium.ScreenSpaceEventType.LEFT_DOWN)
//   const geojson = Cesium.GeoJsonDataSource.load('https://geo.datav.aliyun.com/areas_v3/bound/100000.json', {
//     fill: Cesium.Color.RED.withAlpha(0.5),
//     stroke: Cesium.Color.YELLOW,
//     strokeWidth: 2,
//   })
//   geojson.then((data) => {
//     viewer.dataSources.add(data)
//     viewer.flyTo(data)
//     const entities = data.entities.values
//     entities.forEach((entity) => {
//       entity.polygon!.material = new Cesium.ImageMaterialProperty({
//         image: './Assets/Images/积分.svg',
//         transparent: true,
//         repeat: new Cesium.Cartesian2(8, 8),
//       })
//       entity.polygon!.height = 200
//       entity.polygon!.outline = false
//     })
//   })
// })

</script>



<style scoped>
.monitor-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.cesium-container {
  width: 100%;
  height: 100%;
}

/* 弹窗样式 */
.custom-popup {
  position: absolute;
  /* 使用 transform 将原点移动到弹窗底部中心，方便对齐车辆图标 */
  transform: translate(-50%, -100%);
  width: 200px;
  background-color: rgba(25, 30, 40, 0.9);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #fff;
  z-index: 100;
  pointer-events: auto;
  /* 允许点击弹窗内部 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(59, 130, 246, 0.2);
  border-bottom: 1px solid rgba(59, 130, 246, 0.5);
  font-size: 14px;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #ef4444;
}

.popup-content {
  padding: 12px;
  font-size: 13px;
}

.popup-content p {
  margin: 0 0 8px 0;
}

/* 底部小三角指示器 */
.popup-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #3b82f6;
}

#cesiumContainer {
  height: 100vh;
  width: 100vw;
}

#colorChanger {
  background: #000;
  position: absolute;
  left: 10px;
  top: 10px;
  color: white;
}

* {
  margin: 0;
  padding: 0;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
