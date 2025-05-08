Page({
  data: {
    orderList: [],
    role: 'user' // 默认用户，可通过页面参数切换为staff
  },

  onLoad() {
    // 自动判断当前登录身份
    const userType = wx.getStorageSync('userType');
    console.log(userType);
    let role = 'user';
    if (userType === 'employee') {
      role = 'staff';
    }
    this.setData({ role });
    this.fetchOrderList();
  },

  onShow() {
    this.fetchOrderList();
  },

  fetchOrderList() {
    const token = wx.getStorageSync('token');
    let url = '';
    let id = '';
    if (this.data.role === 'staff') {
      url = 'http://localhost:8080/user/employee/order';
      id = wx.getStorageSync('staffId');
    } else {
      url = 'http://localhost:8080/user/user/order';
      id = wx.getStorageSync('userId');
    }
    wx.request({
      url: url,
      method: 'GET',
      data: this.data.role === 'staff' ? { staffId: id } : { userId: id },
      header: {
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          this.setData({ orderList: res.data.data || [] });
        } else {
          wx.showToast({ title: res.data.msg || '获取订单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  goOrderDetail(e) {
    const orderStr = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: '/pages/order-detail/order-detail?order=' + orderStr
    });
  },

  goEvaluate(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = e.currentTarget.dataset.order;
    if (!order) {
      wx.showToast({
        title: '订单数据错误',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({ 
      url: `/pages/evaluate/evaluate?orderId=${orderId}&type=${order.type}&staffId=${order.staffId}&userId=${order.userId}`
    });
  },

  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const token = wx.getStorageSync('token');
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: 'http://localhost:8080/user/order/cancel/已取消',
            method: 'POST',
            data: {
              id: orderId
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'authentication': token
            },
            success: (resp) => {
              if (resp.data && resp.data.code === 1) {
                wx.showToast({ title: '订单已取消', icon: 'success' });
                this.fetchOrderList();
              } else {
                wx.showToast({ title: resp.data.msg || '取消失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  }
}); 