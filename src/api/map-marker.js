import request, { uploadFile } from '@/utils/request'

/**
 * 地图标注 API
 */

// 分页查询标注
export const listMarkers = (params) => {
  return request({
    url: '/map-marker/list',
    method: 'get',
    params
  })
}

// 查询单个标注
export const getMarker = (id) => {
  return request({
    url: `/map-marker/${id}`,
    method: 'get'
  })
}

// 新增标注
export const addMarker = (data) => {
  return request({
    url: '/map-marker/add',
    method: 'post',
    data
  })
}

// 更新标注
export const updateMarker = (data) => {
  return request({
    url: '/map-marker/update',
    method: 'put',
    data
  })
}

// 删除标注
export const deleteMarker = (id) => {
  return request({
    url: `/map-marker/${id}`,
    method: 'delete'
  })
}

// 上传标注图片
export const uploadPicture = (formData) => {
  return uploadFile('/map-marker/upload', formData)
}
