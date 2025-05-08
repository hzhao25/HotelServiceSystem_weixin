Page({
  data: {
    orderItems: [],
    totalAmount: 0,
    deliveryTime: '',
    startTime: '06:00',
    endTime: '22:00',
    showPwdModal: false
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

  // 设置可选时间范围
  setTimeRange() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 如果当前时间在营业时间内，则从当前时间开始
    if (currentHour >= 6 && currentHour < 22) {
      const startHour = currentHour.toString().padStart(2, '0');
      const startMinute = currentMinute.toString().padStart(2, '0');
      this.setData({
        startTime: `${startHour}:${startMinute}`
      });
    } else if (currentHour >= 22) {
      // 如果当前时间超过22点，则不允许预约
      wx.showToast({
        title: '当前时间已超过营业时间',
        icon: 'none',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }
  },

  // 计算总金额
  calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.count), 0);
  },

  // 选择送达时间
  onTimeChange(e) {
    const selectedTime = e.detail.value;
    const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 检查选择的时间是否在当前时间之后
    if (selectedHour < currentHour || (selectedHour === currentHour && selectedMinute <= currentMinute)) {
      wx.showToast({
        title: '请选择当前时间之后的时间',
        icon: 'none'
      });
      return;
    }

    this.setData({
      deliveryTime: selectedTime
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

  // 提交订单
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