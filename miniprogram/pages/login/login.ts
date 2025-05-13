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
    logoUrl: 'https://readdy.ai/api/search-image?query=luxury%20hotel%20logo%20design%2C%20minimalist%2C%20green%20and%20gold%20color%20scheme%2C%20elegant%20geometric%20shapes%2C%20hospitality%20symbol%2C%20hotel%20service%20icon%2C%20professional%20branding%2C%20isolated%20on%20white%20background%2C%20centered%20composition%2C%20high%20quality%203D%20rendering&width=200&height=200&seq=logo123&orientation=squarish',
    // 忘记密码相关数据
    showForgetPasswordModal: false,
    forgetPasswordStep: 1,
    forgetPhone: '',
    verificationCode: '',
    actualVerificationCode: '', // 实际从服务器获取的验证码
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    forgetPasswordError: ''
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
  },

  // ==== 忘记密码模块 ====
  
  // 显示忘记密码模态框
  showForgetPasswordModal() {
    this.setData({
      showForgetPasswordModal: true,
      forgetPasswordStep: 1,
      forgetPhone: '',
      verificationCode: '',
      actualVerificationCode: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      forgetPasswordError: ''
    });
  },
  
  // 隐藏忘记密码模态框
  hideForgetPasswordModal() {
    this.setData({
      showForgetPasswordModal: false
    });
  },
  
  // 输入手机号
  inputForgetPhone(e: WechatMiniprogram.Input) {
    this.setData({
      forgetPhone: e.detail.value
    });
  },
  
  // 获取验证码
  getVerificationCode() {
    if (!this.data.forgetPhone || this.data.forgetPhone.length !== 11) {
      this.setData({
        forgetPasswordError: '请输入有效的手机号'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '获取验证码中...',
      mask: true
    });
    
    // 调用后端接口获取验证码
    wx.request({
      url: 'http://localhost:8080/user/employee/code',
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res: any) => {
        console.log('验证码接口返回数据:', res.data);
        if (res.data && res.data.code === 1) {
          // 获取验证码成功
          console.log('获取到的验证码:', res.data.data);
          this.setData({
            actualVerificationCode: res.data.data,
            forgetPasswordStep: 2,
            forgetPasswordError: ''
          });
          
          wx.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
        } else {
          this.setData({
            forgetPasswordError: res.data.msg || '获取验证码失败'
          });
        }
      },
      fail: () => {
        this.setData({
          forgetPasswordError: '网络错误，请稍后重试'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 输入验证码
  inputVerificationCode(e: WechatMiniprogram.Input) {
    this.setData({
      verificationCode: e.detail.value
    });
  },
  
  // 验证验证码
  verifyCode() {
    if (!this.data.verificationCode) {
      this.setData({
        forgetPasswordError: '请输入验证码'
      });
      return;
    }
    
    // 验证验证码是否正确
    if (this.data.verificationCode === this.data.actualVerificationCode) {
      this.setData({
        forgetPasswordStep: 3,
        forgetPasswordError: ''
      });
    } else {
      this.setData({
        forgetPasswordError: '验证码错误，请重新输入'
      });
    }
  },
  
  // 输入旧密码
  inputOldPassword(e: WechatMiniprogram.Input) {
    this.setData({
      oldPassword: e.detail.value
    });
  },
  
  // 输入新密码
  inputNewPassword(e: WechatMiniprogram.Input) {
    this.setData({
      newPassword: e.detail.value
    });
  },
  
  // 确认新密码
  inputConfirmPassword(e: WechatMiniprogram.Input) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },
  
  // 重置密码
  resetPassword() {
    // 验证密码是否一致
    if (this.data.newPassword !== this.data.confirmPassword) {
      this.setData({
        forgetPasswordError: '两次输入的密码不一致'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '重置密码中...',
      mask: true
    });
    
    // 调用后端接口重置密码
    wx.request({
      url: 'http://localhost:8080/user/employee/forget',
      method: 'PUT',
      data: {
        phone: this.data.forgetPhone,
        oldPassword: this.data.oldPassword,
        newPassword: this.data.newPassword
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res: any) => {
        if (res.data && res.data.code === 1) {
          // 重置密码成功
          wx.showToast({
            title: '密码重置成功',
            icon: 'success'
          });
          
          // 隐藏模态框
          this.hideForgetPasswordModal();
        } else {
          this.setData({
            forgetPasswordError: res.data.msg || '密码重置失败'
          });
        }
      },
      fail: () => {
        this.setData({
          forgetPasswordError: '网络错误，请稍后重试'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
}); 