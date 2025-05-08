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
    const userId = wx.getStorageSync('userId');
    
    wx.request({
      url: 'http://localhost:8080/user/review/selectUser',
      method: 'GET',
      data: {
        userId: userId
      },
      header: {
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          const reviewList = res.data.data || [];
          this.setData({ reviewList });
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