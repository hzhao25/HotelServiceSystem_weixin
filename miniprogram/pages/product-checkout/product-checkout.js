Page({
  data: {
    orderItems: [],
    totalAmount: 0,
    deliveryTime: '',
    startTime: '06:00',
    endTime: '22:00'
  },

  onLoad(options) {
    // 获取购物车数据
    const cartItems = wx.getStorageSync('cartItems') || [];
    this.setData({
      orderItems: cartItems,
      totalAmount: this.calculateTotal(cartItems)
    });

    // 设置可选时间范围
    this.setTimeRange();
  },

  calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.count), 0).toFixed(2);
  },

  setTimeRange() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    this.setData({
      deliveryTime: currentTime
    });
  },

  onTimeChange(e) {
    this.setData({
      deliveryTime: e.detail.value
    });
  },

  // 显示自定义密码弹窗
  handlePayment() {
    if (!this.data.deliveryTime) {
      wx.showToast({
        title: '请选择送达时间',
        icon: 'none'
      });
      return;
    }
    this.setData({ showPwdModal: true });
  },

  // 关闭弹窗
  closePwdModal() {
    this.setData({ showPwdModal: false });
  },

  // 确认支付
  confirmPwdModal() {
    // 直接用123456作为密码校验
    this.setData({ showPwdModal: false });
    this.submitOrder();
  },

  submitOrder() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 生成LocalDateTime格式的bookTime（yyyy-MM-dd HH:mm）
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const bookTime = `${year}-${month}-${day} ${this.data.deliveryTime}`;
    const userId = wx.getStorageSync('userId');

    const orderData = {
      userId: userId,
      type: '物品',
      description: this.data.orderItems.map(item => `${item.name} x${item.count}`).join(', '),
      image: this.data.orderItems[0]?.image || '',
      bookTime: bookTime,
      emergency: 1,
      price: this.data.totalAmount,
      status: '未接单'
    };

    wx.request({
      url: 'http://localhost:8080/user/order/save',
      method: 'POST',
      data: orderData,
      header: {
        'content-type': 'application/json',
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          wx.showToast({
            title: '支付成功',
            icon: 'success'
          });
          wx.removeStorageSync('cartItems');
          setTimeout(() => {
            wx.redirectTo({
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
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  }
}); 