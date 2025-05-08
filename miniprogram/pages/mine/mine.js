Page({
  data: {
    userInfo: null,
    role: 'user',
    averageRating: 0
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    this.getUserInfo();
    // 从全局数据获取评分
    const app = getApp();
    if (app.globalData && app.globalData.averageRating) {
      this.setData({
        averageRating: app.globalData.averageRating
      });
    }
  },

  getUserInfo() {
    // const userInfo = wx.getStorageSync('userInfo');
    const userInfo = userInfo
    // const userType = wx.getStorageSync('userType');
    const userType = userInfo.type;
    console.log(userType);
    let role = 'customer';
    if (userType === 'employee') {
      role = 'staff';
    }
    this.setData({ 
      userInfo,
      role
    });

    // 如果是员工，获取评价信息
    if (role === 'staff') {
      this.fetchReviews();
    }
  },

  fetchReviews() {
    const token = wx.getStorageSync('token');
    const staffId = wx.getStorageSync('staffId');
    
    wx.request({
      url: 'http://localhost:8080/user/review/selectEmployee',
      method: 'GET',
      data: {
        staffId: staffId
      },
      header: {
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          const reviewList = res.data.data || [];
          // 计算平均评分
          const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = reviewList.length > 0 ? Number((totalRating / reviewList.length).toFixed(1)) : 0;
          
          // 保存到全局数据
          getApp().globalData = getApp().globalData || {};
          getApp().globalData.averageRating = averageRating;
          
          this.setData({
            averageRating
          });
        } else {
          wx.showToast({
            title: res.data.msg || '获取评价失败',
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
  },

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
          wx.clearStorageSync();
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
}); 