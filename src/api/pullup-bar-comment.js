import request from '@/utils/request'

/**
 * 单杠标注评论 API
 */

// 查询评论列表
export const listComments = (barId) => {
  return request({
    url: '/pullup-bar-comment/list',
    method: 'get',
    params: { barId }
  })
}

// 发表评论
export const addComment = (barId, content) => {
  return request({
    url: '/pullup-bar-comment/add',
    method: 'post',
    params: { barId, content }
  })
}

// 删除评论
export const deleteComment = (id) => {
  return request({
    url: `/pullup-bar-comment/${id}`,
    method: 'delete'
  })
}
