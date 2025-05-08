import { EmployeeLoginDTO, Result, EmployeeLoginVO } from '../../typings/api';

Page({
  data: {
    userType: null as 'employee' | 'customer' | null,
    username: '',
    password: '',
    rememberMe: false,
    showPassword: false,
    isLoading: false,
    errorMessage: '',
    logoUrl: 'https://readdy.ai/api/search-image?query=luxury%20hotel%20logo%20design%2C%20minimalist%2C%20green%20and%20gold%20color%20scheme%2C%20elegant%20geometric%20shapes%2C%20hospitality%20symbol%2C%20hotel%20service%20icon%2C%20professional%20branding%2C%20isolated%20on%20white%20background%2C%20centered%20composition%2C%20high%20quality%203D%20rendering&width=200&height=200&seq=logo123&orientation=squarish'
  },

  // 选择用户类型
  selectUserType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type as 'employee' | 'customer';
    this.setData({
      userType: type,
      errorMessage: ''
    });
  },

  // 切换密码可见性
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 处理记住我选项
  handleRememberMe(e: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({
      rememberMe: e.detail.value.includes('remember')
    });
  },

  // 处理登录
  handleLogin(e: WechatMiniprogram.FormSubmit) {
    const { username, password } = e.detail.value;
    
    if (!this.data.userType) {
      this.setData({
        errorMessage: '请选择用户类型'
      });
      return;
    }

    if (!username || !password) {
      this.setData({
        errorMessage: '请输入用户名和密码'
      });
      return;
    }

    this.setData({
      isLoading: true,
      errorMessage: ''
    });

    if (this.data.userType === 'employee') {
      this.employeeLogin(username, password);
    }
  },

  // 员工登录
  employeeLogin(username: string, password: string) {
    const loginData: EmployeeLoginDTO = {
      username,
      password
    };

    wx.request({
      url: 'http://localhost:8080/user/employee/login',
      method: 'POST',
      data: loginData,
      header: {
        'content-type': 'application/json'
      },
      success: (res: any) => {
        const result = res.data as Result<EmployeeLoginVO>;
        if (result.code === 1) {
          // 登录成功
          const userInfo = result.data;
          console.log(userInfo);
          // 保存token和用户信息
          wx.setStorageSync('token', userInfo.token);
          wx.setStorageSync('staffId', userInfo.id);
          wx.setStorageSync('userType', this.data.userType);
          wx.setStorageSync('userInfo', {
            id: userInfo.id,
            username: userInfo.username,
            name: userInfo.name,
            type: 'employee'
          });

          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          // 跳转到首页
          wx.reLaunch({
            url: '/pages/index/index'
          });
        } else {
          this.setData({
            errorMessage: result.msg || '登录失败'
          });
        }
      },
      fail: () => {
        this.setData({
          errorMessage: '网络错误，请稍后重试'
        });
      },
      complete: () => {
        this.setData({
          isLoading: false
        });
      }
    });
  },

  // 处理微信登录
  handleWechatLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          wx.request({
            url: 'http://localhost:8080/user/user/login',
            method: 'POST',
            data: {
              code: res.code
            },
            header: {
              'content-type': 'application/json'
            },
            success: (resp: any) => {
              if (resp.data && resp.data.code === 1) {
                // 登录成功，保存用户信息
                const userInfo = resp.data.data;
                console.log(userInfo);
                wx.setStorageSync('token', userInfo.token);
                wx.setStorageSync('userId', userInfo.id);
                wx.setStorageSync('userInfo', userInfo);
                wx.setStorageSync('userType', this.data.userType);
                wx.setStorageSync('userInfo', {
                  id: userInfo.id,
                  username: userInfo.username,
                  type: 'customer'
                });
                
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });

                // 跳转到首页
                wx.reLaunch({
                  url: '/pages/index/index'
                });
              } else {
                wx.showToast({
                  title: resp.data.msg || '登录失败',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.showToast({
                title: '网络错误',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      }
    });
  }
}); 