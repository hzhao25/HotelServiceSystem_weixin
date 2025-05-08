// 员工登录请求参数
export interface EmployeeLoginDTO {
  username: string;
  password: string;
}

// 员工登录响应数据
export interface EmployeeLoginVO {
  id: number;
  username: string;
  name: string;
  token: string;
}

// 通用响应格式
export interface Result<T> {
  code: number;
  msg: string;
  data: T;
} 