Page({
  data: {
    userInfo: null as any
  },

  onShow() {
    // 每次显示页面时获取最新的用户信息
    this.getUserInfo();
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 导航到订单页面
  navigateToOrders() {
    wx.navigateTo({
      url: '/pages/order/order'
    });
  },

  // 导航到评价页面
  navigateToReviews() {
    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews'
    });
  },

  navigateToUserReviews() {
    wx.navigateTo({
      url: '/pages/user-reviews/user-reviews'
    });
  },

  

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 更新页面状态
          this.setData({
            userInfo: null
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });

          // 跳转到登录页面
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
}); 