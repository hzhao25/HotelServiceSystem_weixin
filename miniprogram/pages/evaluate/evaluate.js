Page({
  data: {
    orderId: '',
    type: '',
    staffId: '',
    rating: 0,
    comment: '',
    userId:''
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId,
      type: options.type,
      staffId: options.staffId,
      userId:options.userId
    });
  },

  setRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  onCommentInput(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  submitReview() {
    if (this.data.rating === 0) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }

    if (!this.data.comment.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    const token = wx.getStorageSync('token');
    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    // 先提交评价
    wx.request({
      url: 'http://localhost:8080/user/review/save',
      method: 'POST',
      data: {
        orderId: this.data.orderId,
        type: this.data.type,
        staffId: this.data.staffId,
        rating: this.data.rating,
        comment: this.data.comment,
        userId:this.data.userId
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          // 评价成功后，更新订单状态为已评价
          wx.request({
            url: 'http://localhost:8080/user/order/cancel/已评价',
            method: 'POST',
            data: {
              id: this.data.orderId
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'authentication': token
            },
            success: (resp) => {
              wx.hideLoading();
              if (resp.data && resp.data.code === 1) {
                wx.showToast({
                  title: '评价成功',
                  icon: 'success',
                  duration: 2000,
                  success: () => {
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 2000);
                  }
                });
              } else {
                wx.showToast({
                  title: resp.data.msg || '更新订单状态失败',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({
                title: '网络错误',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data.msg || '评价失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  }
}); 