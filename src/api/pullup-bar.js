import request from '@/utils/request'

/**
 * 单杠标注 API
 */

// 分页查询单杠标注
export const listBars = (params) => {
  return request({
    url: '/pullup-bar/list',
    method: 'get',
    params
  })
}

// 查询单个单杠标注
export const getBar = (id) => {
  return request({
    url: `/pullup-bar/${id}`,
    method: 'get'
  })
}

// 新增单杠标注
export const addBar = (data) => {
  return request({
    url: '/pullup-bar/add',
    method: 'post',
    data
  })
}

// 更新单杠标注
export const updateBar = (data) => {
  return request({
    url: '/pullup-bar/update',
    method: 'put',
    data
  })
}

// 删除单杠标注
export const deleteBar = (id) => {
  return request({
    url: `/pullup-bar/${id}`,
    method: 'delete'
  })
}
