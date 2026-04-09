<template>
  <div class="map-page">
    <div class="map-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">&larr; 返回</button>
        <h1 class="page-title">地图标注</h1>
      </div>
      <div class="header-right">
        <span class="marker-count">共 {{ total }} 个标注</span>
      </div>
    </div>

    <div class="map-body">
      <!-- 左侧标注列表 -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '&gt;' : '&lt;' }}
        </div>
        <div v-if="!sidebarCollapsed" class="sidebar-content">
          <h3 class="sidebar-title">标注列表</h3>
          <div class="sidebar-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题或备注"
              clearable
              size="small"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
          <div class="marker-list">
            <div
              v-for="marker in markers"
              :key="marker.id"
              class="marker-item"
              :class="{ active: activeMarkerId === marker.id }"
              @click="panToMarker(marker)"
            >
              <div class="marker-item-main">
                <div class="marker-item-title">{{ marker.title }}</div>
                <div class="marker-item-desc" v-if="marker.description">{{ marker.description }}</div>
                <div class="marker-item-coord">
                  {{ Number(marker.longitude).toFixed(4) }}, {{ Number(marker.latitude).toFixed(4) }}
                </div>
                <div v-if="marker.pictures && marker.pictures.length > 0" class="marker-item-thumbs">
                  <img
                    v-for="(img, idx) in marker.pictures"
                    :key="idx"
                    :src="img"
                    alt="标注图片"
                    class="thumb-img"
                  />
                </div>
                <div class="marker-item-reactions">
                  <span
                    class="reaction-btn"
                    :class="{ active: marker.myReaction === 1 }"
                    @click.stop="handleLike(marker)"
                  >
                    👍 <span>{{ marker.likeCount || 0 }}</span>
                  </span>
                  <span
                    class="reaction-btn"
                    :class="{ active: marker.myReaction === -1 }"
                    @click.stop="handleDislike(marker)"
                  >
                    👎 <span>{{ marker.dislikeCount || 0 }}</span>
                  </span>
                </div>
              </div>
              <div class="marker-item-actions" @click.stop>
                <el-dropdown v-if="marker.creatorId === currentUserId" trigger="click" @command="(cmd) => handleMarkerCommand(cmd, marker)">
                  <span class="three-dots">⋮</span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="delete" style="color: #f56c6c;">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div v-if="markers.length === 0" class="empty-tip">
              暂无标注，点击地图添加
            </div>
          </div>
          <div class="sidebar-pagination">
            <el-pagination
              small
              layout="sizes, prev, pager, next"
              :page-sizes="[10, 20, 50]"
              :page-size="pageSize"
              :current-page="pageNum"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>

      <!-- 地图容器 -->
      <div class="map-container" id="map-container">
        <button class="locate-btn" @click="handleLocate" title="回到当前位置">&#x1F4CD;</button>
        <div v-if="mapError" class="map-error">{{ mapError }}</div>
      </div>
    </div>

    <!-- 新增/编辑标注弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标注' : '新增标注'"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="请输入标注标题" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注描述（选填）"
          />
        </el-form-item>
        <el-form-item label="图片">
          <div class="upload-wrapper">
            <div class="image-list">
              <div
                v-for="(img, index) in formData.pictures"
                :key="index"
                class="image-item"
              >
                <el-image
                  :src="img"
                  :preview-src-list="formData.pictures"
                  :initial-index="index"
                  fit="cover"
                  class="thumb-image"
                />
                <div class="image-delete" @click="removeImage(index)">×</div>
              </div>
              <el-upload
                v-if="formData.pictures.length < 3"
                class="marker-uploader"
                :action="'/api/map-marker/upload'"
                :headers="{ Authorization: 'Bearer ' + token }"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :before-upload="beforeUpload"
                accept="image/*"
              >
                <el-icon class="uploader-icon"><Plus /></el-icon>
              </el-upload>
            </div>
            <div class="image-tip">最多上传3张图片，点击图片可放大查看</div>
          </div>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="formData.category" placeholder="选择分类">
            <el-option label="默认" value="default" />
            <el-option label="餐饮" value="food" />
            <el-option label="景点" value="scenic" />
            <el-option label="住宿" value="hotel" />
            <el-option label="购物" value="shopping" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="坐标">
          <span>{{ formData.longitude }}, {{ formData.latitude }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="isEdit && formData.creatorId === currentUserId" type="danger" @click="handleDelete">删除</el-button>
        <el-button v-if="formData.creatorId === currentUserId" type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listMarkers, addMarker, updateMarker, deleteMarker, uploadPicture } from '@/api/map-marker'
import { reactMarker, cancelReaction } from '@/api/map-marker-reaction'

const router = useRouter()

// 当前登录用户ID
const currentUserId = ref(null)

// 解码JWT获取用户ID
const getCurrentUserIdFromToken = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.userId || payload.userId || null
  } catch (e) {
    return null
  }
}

// 地图相关
let mapInstance = null
const AMapRef = ref(null)
const markerMap = new Map()

// 数据
const markers = ref([])
const activeMarkerId = ref(null)
const sidebarCollapsed = ref(false)
const mapError = ref('')

// 分页 + 搜索
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: null,
  title: '',
  description: '',
  category: 'default',
  longitude: 0,
  latitude: 0,
  pictures: [],
  creatorId: null
})

// 返回首页
const goBack = () => {
  router.push('/home')
}

// Token for upload
const token = localStorage.getItem('token')

// 图片上传成功
const handleUploadSuccess = (response) => {
  if (response.data) {
    if (formData.value.pictures.length >= 3) {
      ElMessage.warning('最多只能上传3张图片')
      return
    }
    formData.value.pictures.push(response.data)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

// 图片上传失败
const handleUploadError = () => {
  ElMessage.error('图片上传失败')
}

// 上传前校验
const beforeUpload = (file) => {
  if (formData.value.pictures.length >= 3) {
    ElMessage.warning('最多只能上传3张图片')
    return false
  }
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
  return true
}

// 删除图片
const removeImage = (index) => {
  formData.value.pictures.splice(index, 1)
}

// 动态加载高德地图 JS API
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    console.log('[MapMarker] loadAMapScript 开始')
    if (window.AMap) {
      console.log('[MapMarker] AMap 已存在')
      resolve(window.AMap)
      return
    }
    const key = import.meta.env.VITE_AMAP_KEY
    const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY
    console.log('[MapMarker] key:', key, 'securityKey:', securityKey)

    // 在加载脚本前设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: securityKey
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar`
    script.onload = () => {
      console.log('[MapMarker] 脚本加载完成, window.AMap:', !!window.AMap)
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        reject(new Error('AMap 加载失败: window.AMap 不存在'))
      }
    }
    script.onerror = (e) => {
      console.error('[MapMarker] 脚本加载 onerror', e)
      reject(new Error('AMap 脚本加载失败'))
    }
    document.head.appendChild(script)
  })
}

// 获取用户当前位置
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  })
}

// 初始化地图
const initMap = async () => {
  console.log('[MapMarker] initMap 开始')
  try {
    const AMap = await loadAMapScript()
    console.log('[MapMarker] AMap 加载成功, 创建地图实例...')
    AMapRef.value = AMap

    // 默认北京中心
    let center = [116.397428, 39.90923]
    try {
      center = await getCurrentPosition()
      console.log('[MapMarker] 定位成功:', center)
    } catch (e) {
      console.warn('[MapMarker] 定位失败，使用默认中心:', e.message)
    }

    mapInstance = new AMap.Map('map-container', {
      zoom: 14,
      center
    })
    console.log('[MapMarker] 地图实例创建完成:', !!mapInstance)

    mapInstance.addControl(new AMap.Scale())
    mapInstance.addControl(new AMap.ToolBar({ position: 'RT' }))

    // 点击地图空白处 → 新增标注
    mapInstance.on('click', (e) => {
      openAddDialog(e.lnglat.getLng(), e.lnglat.getLat())
    })

    // 加载已有标注
    await loadMarkers()
  } catch (err) {
    console.error('地图加载失败:', err)
    mapError.value = '地图加载失败: ' + err.message
  }
}

// 加载标注列表
const loadMarkers = async () => {
  try {
    const res = await listMarkers({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined
    })
    const pageData = res.data
    if (Array.isArray(pageData)) {
      // 兼容旧格式（data 为数组）
      markers.value = pageData
      total.value = pageData.length
    } else {
      // 分页格式（data 为 { records, total, ... }）
      markers.value = pageData.records || []
      total.value = pageData.total || 0
    }
    renderMarkers()
  } catch (err) {
    console.error('加载标注失败:', err)
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadMarkers()
}

// 切换每页条数
const handleSizeChange = (size) => {
  pageSize.value = size
  pageNum.value = 1
  loadMarkers()
}

// 切换页码
const handlePageChange = (page) => {
  pageNum.value = page
  loadMarkers()
}

// 渲染所有 Marker
const renderMarkers = () => {
  // 清除旧 Marker
  markerMap.forEach((m) => mapInstance.remove(m))
  markerMap.clear()

  markers.value.forEach((item) => {
    const marker = new AMapRef.value.Marker({
      position: [item.longitude, item.latitude],
      title: item.title,
      offset: new AMapRef.value.Pixel(-13, -30)
    })

    // 点击 Marker → 打开编辑弹窗
    marker.on('click', (e) => {
      openEditDialog(item)
      activeMarkerId.value = item.id
    })

    mapInstance.add(marker)
    markerMap.set(item.id, marker)
  })
}

// 打开新增弹窗
const openAddDialog = (lng, lat) => {
  isEdit.value = false
  formData.value = {
    id: null,
    title: '',
    description: '',
    category: 'default',
    longitude: lng,
    latitude: lat,
    pictures: [],
    creatorId: currentUserId.value
  }
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (item) => {
  isEdit.value = true
  formData.value = {
    id: item.id,
    title: item.title,
    description: item.description || '',
    category: item.category || 'default',
    longitude: item.longitude,
    latitude: item.latitude,
    pictures: item.pictures ? item.pictures : [],
    creatorId: item.creatorId
  }
  dialogVisible.value = true
}

// 保存标注
const handleSave = async () => {
  if (!formData.value.title.trim()) {
    return
  }
  try {
    if (isEdit.value) {
      await updateMarker({
        id: formData.value.id,
        title: formData.value.title,
        description: formData.value.description,
        category: formData.value.category,
        longitude: formData.value.longitude,
        latitude: formData.value.latitude,
        pictures: formData.value.pictures
      })
    } else {
      await addMarker({
        title: formData.value.title,
        description: formData.value.description,
        category: formData.value.category,
        longitude: formData.value.longitude,
        latitude: formData.value.latitude,
        pictures: formData.value.pictures
      })
    }
    dialogVisible.value = false
    await loadMarkers()
  } catch (err) {
    console.error('保存失败:', err)
  }
}

// 删除标注
const handleDelete = async () => {
  try {
    await deleteMarker(formData.value.id)
    dialogVisible.value = false
    activeMarkerId.value = null
    await loadMarkers()
  } catch (err) {
    console.error('删除失败:', err)
  }
}

// 侧边栏点击定位
const panToMarker = (item) => {
  activeMarkerId.value = item.id
  mapInstance.setCenter([item.longitude, item.latitude])
  mapInstance.setZoom(15)
}

// 标注列表操作
const handleMarkerCommand = (command, marker) => {
  if (command === 'edit') {
    openEditDialog(marker)
  } else if (command === 'delete') {
    ElMessageBox.confirm('确定要删除该标注吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteMarker(marker.id)
        activeMarkerId.value = null
        await loadMarkers()
        ElMessage.success('删除成功')
      } catch (err) {
        console.error('删除失败:', err)
        ElMessage.error('删除失败')
      }
    }).catch(() => {})
  }
}

// 点赞
const handleLike = async (marker) => {
  try {
    // 如果已经点赞，则取消
    if (marker.myReaction === 1) {
      await cancelReaction(marker.id)
      if (marker.likeCount) marker.likeCount--
      marker.myReaction = null
    } else {
      // 否则点赞
      await reactMarker(marker.id, 1)
      // 更新本地数据
      if (marker.myReaction === -1 && marker.dislikeCount) {
        marker.dislikeCount--
      }
      marker.likeCount = (marker.likeCount || 0) + 1
      marker.myReaction = 1
    }
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

// 点踩
const handleDislike = async (marker) => {
  try {
    // 如果已经点踩，则取消
    if (marker.myReaction === -1) {
      await cancelReaction(marker.id)
      if (marker.dislikeCount) marker.dislikeCount--
      marker.myReaction = null
    } else {
      // 否则点踩
      await reactMarker(marker.id, -1)
      // 更新本地数据
      if (marker.myReaction === 1 && marker.likeCount) {
        marker.likeCount--
      }
      marker.dislikeCount = (marker.dislikeCount || 0) + 1
      marker.myReaction = -1
    }
  } catch (err) {
    console.error('点踩失败:', err)
  }
}

// 回到当前位置
const handleLocate = async () => {
  try {
    const pos = await getCurrentPosition()
    mapInstance.setCenter(pos)
    mapInstance.setZoom(14)
  } catch (e) {
    console.warn('[MapMarker] 定位失败:', e.message)
  }
}

onMounted(() => {
  // 地图页面需要全屏，覆盖全局 CSS 限制
  document.body.classList.add('map-fullscreen')
  console.log('[MapMarker] onMounted 触发')
  console.log('[MapMarker] AMAP_KEY:', import.meta.env.VITE_AMAP_KEY)
  // 获取当前用户ID
  const token = localStorage.getItem('token')
  if (token) {
    currentUserId.value = getCurrentUserIdFromToken(token)
  }
  initMap()
})

onBeforeUnmount(() => {
  // 离开地图页面时恢复全局样式
  document.body.classList.remove('map-fullscreen')
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.map-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #409eff;
  border-color: #409eff;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.marker-count {
  font-size: 14px;
  color: #909399;
}

.map-body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  transition: width 0.3s;
}

.sidebar.collapsed {
  width: 0;
  border-right: none;
}

.sidebar-toggle {
  position: absolute;
  right: -28px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 60px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-left: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  z-index: 11;
}

.sidebar-toggle:hover {
  color: #409eff;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-search {
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
}

.marker-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.marker-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.marker-item:hover {
  background-color: #f5f7fa;
}

.marker-item.active {
  background-color: #ecf5ff;
}

.marker-item-main {
  flex: 1;
  min-width: 0;
}

.marker-item-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.marker-item-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marker-item-coord {
  font-size: 12px;
  color: #c0c4cc;
}

.marker-item-thumbs {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.thumb-img {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.marker-item-reactions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.reaction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}

.reaction-btn:hover {
  background-color: #f5f7fa;
}

.reaction-btn.active {
  color: #409eff;
  background-color: #ecf5ff;
}

.marker-item-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.marker-item:hover .marker-item-actions {
  opacity: 1;
}

.three-dots {
  display: inline-block;
  font-size: 18px;
  font-weight: bold;
  color: #909399;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
}

.three-dots:hover {
  background-color: #e4e7ed;
  color: #409eff;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #c0c4cc;
  font-size: 14px;
}

.sidebar-pagination {
  padding: 8px 12px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-pagination .el-pagination {
  flex-wrap: wrap;
  justify-content: center;
}

.map-container {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: calc(100vh - 56px);
  position: relative;
}

.locate-btn {
  position: absolute;
  bottom: 40px;
  right: 16px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.locate-btn:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f56c6c;
  font-size: 16px;
}

/* 图片上传样式 */
.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.thumb-image {
  width: 100px;
  height: 100px;
}

.image-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
}

.image-delete:hover {
  background: rgba(0, 0, 0, 0.7);
}

.marker-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.marker-uploader:hover {
  border-color: #409eff;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.image-tip {
  font-size: 12px;
  color: #909399;
}
</style>

<!-- 非 scoped 样式：覆盖全局 CSS 限制，让地图全屏显示 -->
<style>
body.map-fullscreen {
  display: block;
  place-items: unset;
}

body.map-fullscreen #app {
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
  width: 100%;
  height: 100vh;
}
</style>
