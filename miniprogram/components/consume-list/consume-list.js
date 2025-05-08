Component({
  data: {
    consumeList: [],
    totalPrice: 0,
    totalCount: 0,
    showCart: false,
    showOrderDetail: false,
    showPasswordPopup: false,
    paymentPassword: ''
  },
  lifetimes: {
    attached() {
      this.getConsumeList();
    }
  },
  methods: {
    getConsumeList: function() {
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
      wx.request({
        url: 'http://localhost:8080/user/consume',
        method: 'GET',
        header: {
          'authentication': token
        },
        success: (res) => {
          if (res.data.code === 1) {
            const consumeList = res.data.data
              .filter(consume => consume.status === 1)
              .map(consume => ({
                ...consume,
                count: 0
              }));
            this.setData({ consumeList });
          } else {
            wx.showToast({
              title: '获取消耗品失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          if (err.statusCode === 401) {
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 1500);
          } else {
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          }
        }
      });
    },
    addCount: function(e) {
      const { id } = e.currentTarget.dataset;
      const { consumeList } = this.data;
      const index = consumeList.findIndex(item => item.id === id);
      
      if (index > -1) {
        const consume = consumeList[index];
        if (consume.count < consume.stock) {
          consumeList[index].count += 1;
          this.setData({ consumeList });
          this.calculateTotal();
        } else {
          wx.showToast({
            title: '库存不足',
            icon: 'none'
          });
        }
      }
    },
    minusCount: function(e) {
      const { id } = e.currentTarget.dataset;
      const { consumeList } = this.data;
      const index = consumeList.findIndex(item => item.id === id);
      
      if (index > -1 && consumeList[index].count > 0) {
        consumeList[index].count -= 1;
        this.setData({ consumeList });
        this.calculateTotal();
      }
    },
    calculateTotal: function() {
      const { consumeList } = this.data;
      let totalCount = 0;
      let totalPrice = 0;

      consumeList.forEach(item => {
        if (item.count > 0) {
          totalCount += item.count;
          totalPrice += item.count * item.price;
        }
      });

      this.setData({
        totalCount,
        totalPrice
      });
    },
    submitOrder: function() {
      const { consumeList } = this.data;
      const selectedConsumes = consumeList.filter(item => item.count > 0);
      
      if (selectedConsumes.length === 0) {
        wx.showToast({
          title: '请选择消耗品',
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

      const userId = wx.getStorageSync('userId');
      
      // 构建订单数据
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const bookTime = `${year}-${month}-${day} ${hours}:${minutes}`;

      const orderData = {
        userId: userId,
        type: '物品',
        description: selectedConsumes.map(item => `${item.name} x${item.count}`).join(', '),
        image: selectedConsumes[0]?.image || '',
        bookTime: bookTime,
        emergency: 1,
        price: 0,
        status: '未接单'
      };

      // 调用订单生成接口
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
              title: '订单提交成功',
              icon: 'success'
            });
            const consumeList = this.data.consumeList.map(item => ({
              ...item,
              count: 0
            }));
            this.setData({ consumeList });
            this.calculateTotal();
            
            // 订单提交成功后跳转到订单页面
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/order/order'
              });
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.msg || '订单提交失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        }
      });
    },
    hidePasswordPopup: function() {
      this.setData({
        showPasswordPopup: false,
        paymentPassword: ''
      });
    },
    onPasswordInput: function(e) {
      this.setData({
        paymentPassword: e.detail.value
      });
    },
    confirmPayment: function() {
      const { paymentPassword, consumeList } = this.data;
      
      if (paymentPassword.length !== 6) {
        wx.showToast({
          title: '请输入6位支付密码',
          icon: 'none'
        });
        return;
      }

      if (paymentPassword !== '123456') {
        wx.showToast({
          title: '支付密码错误',
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

      const selectedConsumes = consumeList.filter(item => item.count > 0);
      const userId = wx.getStorageSync('userId');
      
      // 构建订单数据
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const bookTime = `${year}-${month}-${day} ${hours}:${minutes}`;

      const orderData = {
        userId: userId,
        type: '消耗品',
        description: selectedConsumes.map(item => `${item.name} x${item.count}`).join(', '),
        image: selectedConsumes[0]?.image || '',
        bookTime: bookTime,
        emergency: 1,
        price: this.data.totalPrice,
        status: '未接单'
      };

      // 调用订单生成接口
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
              title: '支付成功',
              icon: 'success'
            });
            const consumeList = this.data.consumeList.map(item => ({
              ...item,
              count: 0
            }));
            this.setData({
              consumeList,
              showPasswordPopup: false,
              paymentPassword: ''
            });
            this.calculateTotal();
            
            // 支付成功后跳转到订单页面
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/order/order'
              });
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.msg || '支付失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        }
      });
    },
    showOrderDetail: function() {
      this.setData({
        showOrderDetail: true
      });
    },
    hideOrderDetail: function() {
      this.setData({
        showOrderDetail: false
      });
    }
  }
}); 