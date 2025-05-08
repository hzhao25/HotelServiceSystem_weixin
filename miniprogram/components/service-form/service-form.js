Component({
  properties: {
    // 服务类型（清洁或维修）
    serviceType: {
      type: String,
      value: ''
    }
  },

  data: {
    description: '',
    bookTime: '',
    imageUrl: '',
    emergency: 1  // 默认正常
  },

  lifetimes: {
    attached() {
      // 从页面传递过来的参数获取服务类型
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (currentPage && currentPage.data) {
        const activeSubmenu = currentPage.data.activeSubmenu;
        let type = this.data.serviceType;
        
        if (activeSubmenu === 'clean') {
          type = '清洁';
        } else if (activeSubmenu === 'repair') {
          type = '维修';
        }
        
        this.setData({
          serviceType: type
        });
      }
    }
  },

  methods: {
    // 描述输入处理
    onDescriptionInput(e) {
      this.setData({
        description: e.detail.value
      });
    },

    // 时间选择处理
    onTimeChange(e) {
      this.setData({
        bookTime: e.detail.value
      });
    },

    // 选择图片
    chooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          this.setData({
            imageUrl: res.tempFiles[0].tempFilePath
          });
        }
      });
    },

    // 删除图片
    deleteImage() {
      this.setData({
        imageUrl: ''
      });
    },

    // 紧急程度选择
    onEmergencyChange(e) {
      this.setData({
        emergency: parseInt(e.detail.value)
      });
    },

    // 提交订单
    submitOrder() {
      const { description, bookTime, imageUrl, emergency, serviceType } = this.data;
      
      // 表单验证
      if (!description.trim()) {
        wx.showToast({
          title: '请填写描述',
          icon: 'none'
        });
        return;
      }

      if (!bookTime) {
        wx.showToast({
          title: '请选择预约时间',
          icon: 'none'
        });
        return;
      }

      if (!imageUrl) {
        wx.showToast({
          title: '请上传现场图片',
          icon: 'none'
        });
        return;
      }

      const token = wx.getStorageSync('token');
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 2000);
          }
        });
        return;
      }

      // 上传图片到服务器
      wx.uploadFile({
        url: 'http://localhost:8080/user/common/upload',
        filePath: imageUrl,
        name: 'file',
        header: {
          'authentication': token
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 1) {
            this.submitOrderData(data.data);  // data.data 是图片的URL
          } else {
            wx.showToast({
              title: '图片上传失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
      });
    },

    // 提交订单数据
    submitOrderData(imageUrl) {
      const { description, bookTime, emergency, serviceType } = this.data;
      const userId = wx.getStorageSync('userId');
      const token = wx.getStorageSync('token');

      // 获取当前页面的服务类型
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      let type = serviceType || '清洁';
      
      if (currentPage && currentPage.data) {
        const activeSubmenu = currentPage.data.activeSubmenu;
        if (activeSubmenu === 'clean') {
          type = '清洁';
        } else if (activeSubmenu === 'repair') {
          type = '维修';
        }
      }

      // 生成当前日期
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const bookDateTime = `${year}-${month}-${day} ${bookTime}`;

      const orderData = {
        userId: userId,
        type: type,
        description: description,
        image: imageUrl,
        bookTime: bookDateTime,
        emergency: emergency,
        price: 0,
        status: '未接单'
      };

      wx.request({
        url: 'http://localhost:8080/user/order/save',
        method: 'POST',
        header: {
          'content-type': 'application/json',
          'authentication': token
        },
        data: orderData,
        success: (res) => {
          if (res.data.code === 1) {
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            // 重置表单
            this.setData({
              description: '',
              bookTime: '',
              imageUrl: '',
              emergency: 1
            });
            // 跳转到订单页面
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/order/order'
              });
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.msg || '提交失败',
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
    }
  }
}); 