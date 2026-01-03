import request from '@/utils/request';

// 用户注册接口
export const registerUser = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  });
};