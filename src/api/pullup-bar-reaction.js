import request from '@/utils/request'

/**
 * 单杠标注点赞点踩 API
 */

// 点赞/点踩
export const reactBar = (barId, reactionType) => {
  return request({
    url: '/pullup-bar-reaction/react',
    method: 'post',
    params: { barId, reactionType }
  })
}

// 取消点赞/点踩
export const cancelReaction = (barId) => {
  return request({
    url: '/pullup-bar-reaction/cancel',
    method: 'delete',
    params: { barId }
  })
}
