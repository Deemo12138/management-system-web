import request from '@/utils/request';

/**
 * 德州扑克游戏 API
 */

// 创建游戏房间
export const createGame = (data) => {
  return request({
    url: '/poker/create',
    method: 'post',
    data,
  });
};

// 开始游戏
export const startGame = (gameId) => {
  return request({
    url: `/poker/start/${gameId}`,
    method: 'post',
  });
};

// 获取游戏状态
export const getGameStatus = (gameId) => {
  return request({
    url: `/poker/status/${gameId}`,
    method: 'get',
  });
};

// 玩家操作
export const performAction = (data) => {
  return request({
    url: '/poker/action',
    method: 'post',
    data,
  });
};

// AI自动操作
export const performAiActions = (gameId) => {
  return request({
    url: `/poker/ai-action/${gameId}`,
    method: 'post',
  });
};

// 进入下一阶段
export const advanceToNextPhase = (gameId) => {
  return request({
    url: `/poker/next-phase/${gameId}`,
    method: 'post',
  });
};

// 摊牌结算
export const showdown = (gameId) => {
  return request({
    url: `/poker/showdown/${gameId}`,
    method: 'post',
  });
};

// 开始新一局
export const startNewRound = (gameId) => {
  return request({
    url: `/poker/new-round/${gameId}`,
    method: 'post',
  });
};
