Page({
  data: {
    reviewList: []
  },

  onLoad() {
    this.fetchReviews();
  },

  onShow() {
    this.fetchReviews();
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
          this.setData({ reviewList });
          
          // 计算平均评分
          const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = reviewList.length > 0 ? Number((totalRating / reviewList.length).toFixed(1)) : 0;
          
          // 将平均评分保存到全局数据
          getApp().globalData = getApp().globalData || {};
          getApp().globalData.averageRating = averageRating;
          
          // 通知"我的"页面更新评分
          const pages = getCurrentPages();
          const minePage = pages.find(page => page.route === 'pages/mine/mine');
          if (minePage) {
            minePage.setData({
              averageRating: averageRating
            });
          }
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
  }
}); 