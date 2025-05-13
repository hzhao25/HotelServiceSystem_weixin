// 定义接口类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface ReviewItem {
  id: number;
  userId: number;
  staffId: number;
  orderId: number;
  content: string;
  rating: number;
  createTime: string;
  updateTime: string;
}

Page({
  data: {
    userInfo: null as any,
    role: 'user',
    averageRating: 0
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    // 每次显示页面时获取最新的用户信息
    this.getUserInfo();
    // 从全局数据获取评分
    const app = getApp<{globalData?: {averageRating?: number}}>();
    if (app.globalData && app.globalData.averageRating) {
      this.setData({
        averageRating: app.globalData.averageRating
      });
    }
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }

     // const userInfo = wx.getStorageSync('userInfo');
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
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult<ApiResponse<ReviewItem[]>>) => {
        if (res.data.code === 1) {
          const reviewList = res.data.data || [];
          // 计算平均评分
          const totalRating = reviewList.reduce((sum: number, review: ReviewItem) => sum + review.rating, 0);
          const averageRating = reviewList.length > 0 ? Number((totalRating / reviewList.length).toFixed(1)) : 0;
          
          // 保存到全局数据
          const app = getApp<{globalData?: {averageRating?: number}}>();
          app.globalData = app.globalData || {};
          app.globalData.averageRating = averageRating;
          
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