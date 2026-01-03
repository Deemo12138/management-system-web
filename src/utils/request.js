import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // API 基础路径（使用相对路径，配合 Vite 代理）
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 可以添加 token 等认证信息
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 添加跨域请求头
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 通用响应格式处理（支持 code 为字符串或数字，以及 success 字段）
    if (res.code === 200 || res.code === '200' || res.success === true) {
      return res;
    } else {
      // 显示错误信息
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 5 * 1000,
      });
      
      // 如果是登录失败等需要特殊处理的情况，可以在这里添加逻辑
      if (res.code === 401 || res.code === '401') {
        // 清除 token 并跳转到登录页面
        localStorage.removeItem('token');
        // 可以在这里添加路由跳转逻辑
      }
      
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  error => {
    // 对响应错误做些什么
    console.error('响应错误:', error);
    
    // 详细的错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 400:
          ElMessage({
            message: '请求参数错误',
            type: 'error',
            duration: 5 * 1000,
          });
          break;
        case 401:
          ElMessage({
            message: '未授权，请重新登录',
            type: 'error',
            duration: 5 * 1000,
          });
          localStorage.removeItem('token');
          // 可以在这里添加路由跳转逻辑
          break;
        case 403:
          ElMessage({
            message: '禁止访问，您没有权限',
            type: 'error',
            duration: 5 * 1000,
          });
          break;
        case 404:
          ElMessage({
            message: '接口地址不存在',
            type: 'error',
            duration: 5 * 1000,
          });
          break;
        case 500:
          ElMessage({
            message: '服务器内部错误',
            type: 'error',
            duration: 5 * 1000,
          });
          break;
        default:
          ElMessage({
            message: error.response.data?.message || `请求失败，状态码: ${error.response.status}`,
            type: 'error',
            duration: 5 * 1000,
          });
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      ElMessage({
        message: '网络请求失败，请检查网络连接',
        type: 'error',
        duration: 5 * 1000,
      });
    } else {
      // 发送请求时出错
      ElMessage({
        message: error.message || '请求失败',
        type: 'error',
        duration: 5 * 1000,
      });
    }
    
    return Promise.reject(error);
  }
);

export default service;