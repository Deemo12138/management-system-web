import request from '@/utils/request';

// 用户登录接口
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
};

// 获取验证码图片接口（可选，根据实际情况使用）
export const getCaptcha = () => {
  return request({
    url: '/captcha',
    method: 'get',
    responseType: 'blob', // 如果返回的是图片二进制数据
  });
};