import request from '@/utils/request'

/**
 * 地图标注点赞点踩 API
 */

// 点赞/点踩
export const reactMarker = (markerId, reactionType) => {
  return request({
    url: '/map-marker-reaction/react',
    method: 'post',
    params: { markerId, reactionType }
  })
}

// 取消点赞/点踩
export const cancelReaction = (markerId) => {
  return request({
    url: '/map-marker-reaction/cancel',
    method: 'delete',
    params: { markerId }
  })
}

// 获取统计数据
export const getReactionStats = (markerId) => {
  return request({
    url: `/map-marker-reaction/stats/${markerId}`,
    method: 'get'
  })
}

// 获取当前用户态度
export const getMyReaction = (markerId) => {
  return request({
    url: `/map-marker-reaction/my-reaction/${markerId}`,
    method: 'get'
  })
}
