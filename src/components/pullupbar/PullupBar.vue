<template>
  <div class="pullup-page">
    <div class="pullup-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">&larr; 返回</button>
        <h1 class="page-title">单杠在哪儿</h1>
      </div>
      <div class="header-right">
        <span class="bar-count">共 {{ total }} 个单杠</span>
      </div>
    </div>

    <div class="pullup-body">
      <!-- 左侧边栏 -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '>' : '<' }}
        </div>
        <div v-if="!sidebarCollapsed" class="sidebar-content">
          <h3 class="sidebar-title">单杠列表</h3>
          <div class="sidebar-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索位置描述或备注"
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
          <div class="sidebar-filter">
            <el-select v-model="filterBarType" placeholder="单杠类型" size="small" clearable @change="handleSearch">
              <el-option label="全部类型" value="" />
              <el-option label="普通单杠" value="standard" />
              <el-option label="双杠" value="parallel" />
              <el-option label="户外健身站" value="outdoor_gym" />
              <el-option label="儿童游乐设施" value="playground" />
              <el-option label="自制/非标准" value="custom" />
            </el-select>
          </div>
          <div class="bar-list">
            <div
              v-for="bar in bars"
              :key="bar.id"
              class="bar-item"
              :class="{ active: activeBarId === bar.id }"
              @click="panToBar(bar)"
            >
              <div class="bar-item-main">
                <div class="bar-item-header">
                  <span class="bar-item-title">{{ bar.title }}</span>
                  <span class="reliability-tag" :class="bar.reliability">{{ reliabilityText(bar.reliability) }}</span>
                </div>
                <div class="bar-item-desc" v-if="bar.description">{{ bar.description }}</div>
                <div class="bar-item-type">
                  <span class="type-tag">{{ barTypeText(bar.barType) }}</span>
                </div>
                <div class="bar-item-coord">
                  {{ Number(bar.longitude).toFixed(4) }}, {{ Number(bar.latitude).toFixed(4) }}
                </div>
                <div v-if="bar.pictures && bar.pictures.length > 0" class="bar-item-thumbs">
                  <img
                    v-for="(img, idx) in bar.pictures"
                    :key="idx"
                    :src="img"
                    alt="单杠照片"
                    class="thumb-img"
                  />
                </div>
                <div class="bar-item-reactions">
                  <span
                    class="reaction-btn"
                    :class="{ active: bar.myReaction === 1 }"
                    @click.stop="handleLike(bar)"
                  >
                    👍 <span>{{ bar.likeCount || 0 }}</span>
                  </span>
                  <span
                    class="reaction-btn"
                    :class="{ active: bar.myReaction === -1 }"
                    @click.stop="handleDislike(bar)"
                  >
                    👎 <span>{{ bar.dislikeCount || 0 }}</span>
                  </span>
                  <span class="comment-count" @click.stop="openDetail(bar)">
                    💬 <span>{{ bar.commentCount || 0 }}</span>
                  </span>
                </div>
              </div>
              <div class="bar-item-actions" @click.stop>
                <el-dropdown v-if="bar.creatorId === currentUserId" trigger="click" @command="(cmd) => handleBarCommand(cmd, bar)">
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
            <div v-if="bars.length === 0" class="empty-tip">
              暂无单杠标注，点击地图添加
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
      <div class="map-container" id="pullup-map-container">
        <button class="locate-btn" @click="handleLocate" title="回到当前位置">&#x1F4CD;</button>
        <div v-if="mapError" class="map-error">{{ mapError }}</div>
      </div>

      <!-- 详情面板（点击 Marker 弹出） -->
      <div v-if="detailVisible" class="detail-panel">
        <div class="detail-header">
          <h3 class="detail-title">{{ detailData.title }}</h3>
          <button class="detail-close" @click="detailVisible = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-meta">
            <span class="reliability-tag lg" :class="detailData.reliability">{{ reliabilityText(detailData.reliability) }}</span>
            <span class="type-tag">{{ barTypeText(detailData.barType) }}</span>
            <span class="detail-creator">{{ detailData.creatorName }}</span>
            <span class="detail-time">{{ formatDate(detailData.createTime) }}</span>
          </div>
          <div class="detail-desc" v-if="detailData.description">{{ detailData.description }}</div>
          <div class="detail-pictures" v-if="detailData.pictures && detailData.pictures.length > 0">
            <el-image
              v-for="(img, idx) in detailData.pictures"
              :key="idx"
              :src="img"
              :preview-src-list="detailData.pictures"
              :initial-index="idx"
              fit="cover"
              class="detail-img"
            />
          </div>
          <div class="detail-coord">
            📍 {{ Number(detailData.longitude).toFixed(4) }}, {{ Number(detailData.latitude).toFixed(4) }}
          </div>
          <div class="detail-reactions">
            <span
              class="reaction-btn"
              :class="{ active: detailData.myReaction === 1 }"
              @click="handleLikeDetail"
            >
              👍 {{ detailData.likeCount || 0 }}
            </span>
            <span
              class="reaction-btn"
              :class="{ active: detailData.myReaction === -1 }"
              @click="handleDislikeDetail"
            >
              👎 {{ detailData.dislikeCount || 0 }}
            </span>
          </div>

          <!-- 评论区 -->
          <div class="comment-section">
            <h4 class="comment-title">评论 ({{ comments.length }})</h4>
            <div class="comment-list">
              <div v-for="c in comments" :key="c.id" class="comment-item">
                <div class="comment-header">
                  <span class="comment-user">{{ c.username }}</span>
                  <span class="comment-time">{{ formatDate(c.createTime) }}</span>
                  <span
                    v-if="c.userId === currentUserId"
                    class="comment-delete"
                    @click="handleDeleteComment(c.id)"
                  >删除</span>
                </div>
                <div class="comment-content">{{ c.content }}</div>
              </div>
              <div v-if="comments.length === 0" class="comment-empty">暂无评论</div>
            </div>
            <div class="comment-input">
              <el-input
                v-model="commentText"
                placeholder="写评论..."
                size="small"
                maxlength="200"
                @keyup.enter="handleSendComment"
              >
                <template #append>
                  <el-button @click="handleSendComment" :disabled="!commentText.trim()">发送</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑标注弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑单杠' : '新增单杠'"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="位置描述">
          <el-input v-model="formData.title" placeholder="如：XX公园南门单杠" />
        </el-form-item>
        <el-form-item label="单杠类型">
          <el-select v-model="formData.barType" placeholder="选择类型">
            <el-option label="普通单杠" value="standard" />
            <el-option label="双杠" value="parallel" />
            <el-option label="户外健身站" value="outdoor_gym" />
            <el-option label="儿童游乐设施" value="playground" />
            <el-option label="自制/非标准" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="如：2米高，旁边还有双杠（选填）"
          />
        </el-form-item>
        <el-form-item label="照片">
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
                <div class="image-delete" @click="removeImage(index)">&times;</div>
              </div>
              <el-upload
                v-if="formData.pictures.length < 3"
                class="bar-uploader"
                :action="'/api/pullup-bar/upload'"
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
            <div class="image-tip">最多上传3张照片，点击可放大</div>
          </div>
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
import { listBars, addBar, updateBar, deleteBar } from '@/api/pullup-bar'
import { reactBar, cancelReaction } from '@/api/pullup-bar-reaction'
import { listComments, addComment, deleteComment } from '@/api/pullup-bar-comment'

const router = useRouter()

const currentUserId = ref(null)
const token = localStorage.getItem('token')

const getCurrentUserIdFromToken = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.userId || null
  } catch (e) {
    return null
  }
}

// 地图相关
let mapInstance = null
const AMapRef = ref(null)
const markerMap = new Map()

// 数据
const bars = ref([])
const activeBarId = ref(null)
const sidebarCollapsed = ref(false)
const mapError = ref('')

// 分页 + 搜索 + 筛选
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')
const filterBarType = ref('')

// 详情面板
const detailVisible = ref(false)
const detailData = ref({})
const comments = ref([])
const commentText = ref('')

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: null,
  title: '',
  description: '',
  barType: 'standard',
  longitude: 0,
  latitude: 0,
  pictures: [],
  creatorId: null
})

// 类型映射
const barTypeText = (type) => {
  const map = { standard: '普通单杠', parallel: '双杠', outdoor_gym: '户外健身站', playground: '儿童游乐设施', custom: '自制/非标准' }
  return map[type] || '普通单杠'
}

const reliabilityText = (r) => {
  const map = { reliable: '可信', pending: '待验证', doubtful: '存疑', normal: '普通' }
  return map[r] || '待验证'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

// 返回首页
const goBack = () => {
  router.push('/home')
}

// 图片上传
const handleUploadSuccess = (response) => {
  if (response.data) {
    if (formData.value.pictures.length >= 3) {
      ElMessage.warning('最多只能上传3张照片')
      return
    }
    formData.value.pictures.push(response.data)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const beforeUpload = (file) => {
  if (formData.value.pictures.length >= 3) {
    ElMessage.warning('最多只能上传3张照片')
    return false
  }
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片不能超过10MB')
    return false
  }
  return true
}

const removeImage = (index) => {
  formData.value.pictures.splice(index, 1)
}

// 加载高德地图
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
      return
    }
    const key = import.meta.env.VITE_AMAP_KEY
    const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY
    window._AMapSecurityConfig = { securityJsCode: securityKey }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar,AMap.Geolocation`
    script.onload = () => {
      if (window.AMap) resolve(window.AMap)
      else reject(new Error('AMap 加载失败'))
    }
    script.onerror = () => reject(new Error('AMap 脚本加载失败'))
    document.head.appendChild(script)
  })
}

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!AMapRef.value) {
      reject(new Error('高德地图尚未加载'))
      return
    }
    const geolocation = new AMapRef.value.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      needAddress: false
    })
    geolocation.getCurrentPosition((status, result) => {
      if (status === 'complete') {
        resolve([result.position.lng, result.position.lat])
      } else {
        reject(new Error(result.message || '定位失败'))
      }
    })
  })
}

// 初始化地图
const initMap = async () => {
  try {
    const AMap = await loadAMapScript()
    AMapRef.value = AMap

    let center = [116.397428, 39.90923]
    try {
      center = await getCurrentPosition()
    } catch (e) {
      console.warn('定位失败，使用默认中心:', e.message)
    }

    mapInstance = new AMap.Map('pullup-map-container', {
      zoom: 14,
      center
    })

    mapInstance.addControl(new AMap.Scale())
    mapInstance.addControl(new AMap.ToolBar({ position: 'RT' }))

    mapInstance.on('click', (e) => {
      openAddDialog(e.lnglat.getLng(), e.lnglat.getLat())
    })

    await loadBars()
  } catch (err) {
    console.error('地图加载失败:', err)
    mapError.value = '地图加载失败: ' + err.message
  }
}

// 加载标注列表
const loadBars = async () => {
  try {
    const res = await listBars({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      barType: filterBarType.value || undefined
    })
    const pageData = res.data
    if (Array.isArray(pageData)) {
      bars.value = pageData
      total.value = pageData.length
    } else {
      bars.value = pageData.records || []
      total.value = pageData.total || 0
    }
    renderMarkers()
  } catch (err) {
    console.error('加载失败:', err)
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadBars()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  pageNum.value = 1
  loadBars()
}

const handlePageChange = (page) => {
  pageNum.value = page
  loadBars()
}

// Marker 图标颜色
const getMarkerColor = (reliability) => {
  const colors = {
    reliable: '#67c23a',  // 绿色 - 可信
    pending: '#e6a23c',   // 黄色 - 待验证
    doubtful: '#909399',  // 灰色 - 存疑
    normal: '#409eff'     // 蓝色 - 普通
  }
  return colors[reliability] || '#e6a23c'
}

// 渲染所有 Marker
const renderMarkers = () => {
  markerMap.forEach((m) => mapInstance.remove(m))
  markerMap.clear()

  const AMap = AMapRef.value
  bars.value.forEach((item) => {
    const color = getMarkerColor(item.reliability)
    const marker = new AMap.Marker({
      position: [item.longitude, item.latitude],
      title: item.title,
      offset: new AMap.Pixel(-13, -30),
      content: `<div style="width:26px;height:36px;display:flex;align-items:flex-start;justify-content:center;">
        <svg width="26" height="36" viewBox="0 0 26 36">
          <path d="M13 0C5.82 0 0 5.6 0 12.5 0 22 13 36 13 36s13-14 13-23.5C26 5.6 20.18 0 13 0z" fill="${color}"/>
          <circle cx="13" cy="12" r="5" fill="white"/>
        </svg>
      </div>`
    })

    marker.on('click', () => {
      openDetail(item)
      activeBarId.value = item.id
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
    barType: 'standard',
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
    barType: item.barType || 'standard',
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
    ElMessage.warning('请输入位置描述')
    return
  }
  try {
    if (isEdit.value) {
      await updateBar({
        id: formData.value.id,
        title: formData.value.title,
        description: formData.value.description,
        barType: formData.value.barType,
        longitude: formData.value.longitude,
        latitude: formData.value.latitude,
        pictures: formData.value.pictures
      })
    } else {
      await addBar({
        title: formData.value.title,
        description: formData.value.description,
        barType: formData.value.barType,
        longitude: formData.value.longitude,
        latitude: formData.value.latitude,
        pictures: formData.value.pictures
      })
    }
    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
    await loadBars()
  } catch (err) {
    console.error('保存失败:', err)
  }
}

// 删除标注
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该单杠标注吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteBar(formData.value.id)
    dialogVisible.value = false
    activeBarId.value = null
    detailVisible.value = false
    ElMessage.success('删除成功')
    await loadBars()
  } catch (err) {
    if (err !== 'cancel') console.error('删除失败:', err)
  }
}

// 侧边栏操作
const handleBarCommand = (command, bar) => {
  if (command === 'edit') {
    openEditDialog(bar)
  } else if (command === 'delete') {
    ElMessageBox.confirm('确定要删除该单杠标注吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteBar(bar.id)
        activeBarId.value = null
        detailVisible.value = false
        ElMessage.success('删除成功')
        await loadBars()
      } catch (err) {
        console.error('删除失败:', err)
        ElMessage.error('删除失败')
      }
    }).catch(() => {})
  }
}

// 定位
const panToBar = (item) => {
  activeBarId.value = item.id
  mapInstance.setCenter([item.longitude, item.latitude])
  mapInstance.setZoom(15)
}

// 打开详情面板
const openDetail = async (item) => {
  detailData.value = item
  activeBarId.value = item.id
  detailVisible.value = true
  // 加载评论
  try {
    const res = await listComments(item.id)
    comments.value = res.data || []
  } catch (err) {
    comments.value = []
  }
}

// 点赞/点踩（列表中）
const handleLike = async (bar) => {
  try {
    if (bar.myReaction === 1) {
      await cancelReaction(bar.id)
      if (bar.likeCount) bar.likeCount--
      bar.myReaction = null
    } else {
      await reactBar(bar.id, 1)
      if (bar.myReaction === -1 && bar.dislikeCount) bar.dislikeCount--
      bar.likeCount = (bar.likeCount || 0) + 1
      bar.myReaction = 1
    }
  } catch (err) {
    console.error('操作失败:', err)
  }
}

const handleDislike = async (bar) => {
  try {
    if (bar.myReaction === -1) {
      await cancelReaction(bar.id)
      if (bar.dislikeCount) bar.dislikeCount--
      bar.myReaction = null
    } else {
      await reactBar(bar.id, -1)
      if (bar.myReaction === 1 && bar.likeCount) bar.likeCount--
      bar.dislikeCount = (bar.dislikeCount || 0) + 1
      bar.myReaction = -1
    }
  } catch (err) {
    console.error('操作失败:', err)
  }
}

// 点赞/点踩（详情面板）
const handleLikeDetail = async () => {
  await handleLike(detailData.value)
}

const handleDislikeDetail = async () => {
  await handleDislike(detailData.value)
}

// 评论
const handleSendComment = async () => {
  if (!commentText.value.trim()) return
  try {
    const res = await addComment(detailData.value.id, commentText.value.trim())
    comments.value.unshift(res.data)
    detailData.value.commentCount = (detailData.value.commentCount || 0) + 1
    commentText.value = ''
  } catch (err) {
    console.error('评论失败:', err)
  }
}

const handleDeleteComment = async (commentId) => {
  try {
    await deleteComment(commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
    detailData.value.commentCount = Math.max(0, (detailData.value.commentCount || 1) - 1)
  } catch (err) {
    console.error('删除评论失败:', err)
  }
}

// 定位按钮
const handleLocate = async () => {
  if (!mapInstance) {
    ElMessage.error('地图尚未加载完成')
    return
  }
  try {
    const pos = await getCurrentPosition()
    mapInstance.setCenter(pos)
    mapInstance.setZoom(14)
    ElMessage.success('已定位到当前位置')
  } catch (e) {
    ElMessage.error('定位失败: ' + e.message)
  }
}

onMounted(() => {
  document.body.classList.add('pullup-fullscreen')
  if (token) {
    currentUserId.value = getCurrentUserIdFromToken(token)
  }
  initMap()
})

onBeforeUnmount(() => {
  document.body.classList.remove('pullup-fullscreen')
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.pullup-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pullup-header {
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

.bar-count {
  font-size: 14px;
  color: #909399;
}

.pullup-body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 300px;
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

.sidebar-toggle:hover { color: #409eff; }

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

.sidebar-filter {
  padding: 4px 12px 8px;
}

.bar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.bar-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.bar-item:hover { background-color: #f5f7fa; }
.bar-item.active { background-color: #ecf5ff; }

.bar-item-main { flex: 1; min-width: 0; }

.bar-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.bar-item-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-item-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-item-type { margin-bottom: 4px; }

.type-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  background: #f0f2f5;
  color: #606266;
}

.bar-item-coord {
  font-size: 12px;
  color: #c0c4cc;
}

.bar-item-thumbs {
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

.bar-item-reactions {
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

.reaction-btn:hover { background-color: #f5f7fa; }
.reaction-btn.active { color: #409eff; background-color: #ecf5ff; }

.comment-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.comment-count:hover { background-color: #f5f7fa; }

.reliability-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.reliability-tag.reliable { background: #e1f3d8; color: #67c23a; }
.reliability-tag.pending { background: #faecd8; color: #e6a23c; }
.reliability-tag.doubtful { background: #f4f4f5; color: #909399; }
.reliability-tag.normal { background: #d9ecff; color: #409eff; }

.reliability-tag.lg { font-size: 12px; padding: 2px 8px; }

.bar-item-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.bar-item:hover .bar-item-actions { opacity: 1; }

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

.three-dots:hover { background-color: #e4e7ed; color: #409eff; }

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

/* 地图 */
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

.locate-btn:hover { background: #f5f7fa; border-color: #409eff; }

.map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f56c6c;
  font-size: 16px;
}

/* 详情面板 */
.detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 20;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.detail-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.detail-close:hover { color: #303133; }

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-creator {
  font-size: 13px;
  color: #606266;
}

.detail-time {
  font-size: 12px;
  color: #c0c4cc;
}

.detail-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-pictures {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-img {
  width: 100px;
  height: 100px;
  border-radius: 6px;
}

.detail-coord {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.detail-reactions {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #e4e7ed;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.detail-reactions .reaction-btn {
  font-size: 14px;
  padding: 6px 12px;
}

/* 评论区 */
.comment-section {
  margin-top: 4px;
}

.comment-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
}

.comment-list {
  margin-bottom: 12px;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f2f3f5;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 13px;
  font-weight: bold;
  color: #303133;
}

.comment-time {
  font-size: 11px;
  color: #c0c4cc;
}

.comment-delete {
  font-size: 12px;
  color: #f56c6c;
  cursor: pointer;
  margin-left: auto;
}

.comment-delete:hover { text-decoration: underline; }

.comment-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.comment-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
  font-size: 13px;
}

.comment-input {
  margin-top: 8px;
}

/* 上传 */
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

.image-delete:hover { background: rgba(0, 0, 0, 0.7); }

.bar-uploader {
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

.bar-uploader:hover { border-color: #409eff; }

.uploader-icon { font-size: 28px; color: #8c939d; }

.image-tip { font-size: 12px; color: #909399; }
</style>

<!-- 全屏样式覆盖 -->
<style>
body.pullup-fullscreen {
  display: block;
  place-items: unset;
}

body.pullup-fullscreen #app {
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
  width: 100%;
  height: 100vh;
}
</style>
