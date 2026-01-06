import request from '@/utils/request';

// 用户登录接口
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
};

// 验证token是否有效接口
export const checkToken = (token) => {
  return request({
    url: '/auth/checkToken',
    method: 'get',
    params: { token }
  });
};

