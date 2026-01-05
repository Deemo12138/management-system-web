import CryptoJS from 'crypto-js';

// 获取前端固定盐（从环境变量中获取）
export const getFrontFixedSalt = () => {
  return import.meta.env.VITE_FRONT_FIXED_SALT || 'default_fixed_salt_123'; // 提供默认值作为备用
};

// 生成随机盐（32位字符串）
export const generateRandomSalt = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
};

// MD5 加密函数
export const md5Encrypt = (text) => {
  return CryptoJS.MD5(text).toString();
};

// SHA256 加密函数
export const sha256Encrypt = (text) => {
  return CryptoJS.SHA256(text).toString();
};

// 密码加密方法（封装完整的加密逻辑）
export const encryptPassword = (password, randomSalt = '') => {
  const fixedSalt = getFrontFixedSalt();
  // 按照要求的顺序：明文密码 + 前端固定盐
  const passwordToEncrypt = password + fixedSalt;
  return sha256Encrypt(passwordToEncrypt);
};

// 简单的 Base64 编码
export const base64Encode = (text) => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
};

// 简单的 Base64 解码
export const base64Decode = (text) => {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
};