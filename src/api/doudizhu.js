import request from '@/utils/request'

/**
 * 创建斗地主游戏
 */
export function createGame(data) {
  return request({
    url: '/doudizhu/create',
    method: 'post',
    data
  })
}

/**
 * 获取游戏状态
 */
export function getGameStatus(gameId) {
  return request({
    url: `/doudizhu/status/${gameId}`,
    method: 'get'
  })
}

/**
 * 开始游戏
 */
export function startGame(gameId) {
  return request({
    url: `/doudizhu/start/${gameId}`,
    method: 'post'
  })
}

/**
 * 叫分
 */
export function callBid(data) {
  return request({
    url: '/doudizhu/bid',
    method: 'post',
    data
  })
}

/**
 * 出牌
 */
export function playCards(data) {
  return request({
    url: '/doudizhu/play',
    method: 'post',
    data
  })
}

/**
 * 不出
 */
export function pass(gameId, playerPosition) {
  return request({
    url: `/doudizhu/pass/${gameId}/${playerPosition}`,
    method: 'post'
  })
}
