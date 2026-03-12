import request from '@/utils/request'

/**
 * 大模型接口
 */

/**
 * 流式聊天
 * @param {string} message - 用户消息
 * @returns {EventSource} EventSource 对象
 */
export function chatStream(message) {
  const url = `${process.env.VUE_APP_BASE_API}/api/llm/chat/stream?message=${encodeURIComponent(message)}`
  return new EventSource(url)
}

/**
 * 简单聊天（非流式）
 * @param {Object} data - 请求数据
 * @param {string} data.message - 用户消息
 * @param {string} data.model - 模型名称
 * @param {number} data.temperature - 温度
 * @param {number} data.maxTokens - 最大token数
 * @returns {Promise}
 */
export function chatSimple(data) {
  return request({
    url: '/api/llm/chat/simple',
    method: 'post',
    data
  })
}

/**
 * 完整聊天
 * @param {Object} data - 请求数据
 * @returns {Promise}
 */
export function chat(data) {
  return request({
    url: '/api/llm/chat',
    method: 'post',
    data
  })
}
