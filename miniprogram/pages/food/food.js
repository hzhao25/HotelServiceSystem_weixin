Page({
  data: {
    dishList: [],
    totalPrice: 0,
    totalCount: 0,
    showFlavorPopup: false,
    currentDish: null,
    selectedFlavors: {},
    showOrderDetail: false
  },

  onLoad: function() {
    this.getDishList();
  },

  // 获取菜品列表
  getDishList: function() {
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
      url: 'http://localhost:8080/user/dish',
      method: 'GET',
      header: {
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          // 为每个菜品添加count属性和处理flavors数据
          const dishList = res.data.data.map(dish => ({
            ...dish,
            count: 0,
            flavors: dish.flavors.map(flavor => ({
              ...flavor,
              value: JSON.parse(flavor.value)
            }))
          }));
          this.setData({ dishList });
        } else {
          wx.showToast({
            title: '获取菜品失败',
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
          // 可以在这里处理登录过期的逻辑，比如跳转到登录页
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

  // 显示口味选择弹窗
  showFlavorPopup: function(e) {
    const dish = e.currentTarget.dataset.dish;
    if (dish.flavors && dish.flavors.length > 0) {
      this.setData({
        showFlavorPopup: true,
        currentDish: dish,
        selectedFlavors: {}
      });
    }
  },

  // 隐藏口味选择弹窗
  hideFlavorPopup: function() {
    this.setData({
      showFlavorPopup: false,
      currentDish: null,
      selectedFlavors: {}
    });
  },

  // 选择口味
  selectFlavor: function(e) {
    const { flavorId, option } = e.currentTarget.dataset;
    const selectedFlavors = { ...this.data.selectedFlavors };
    selectedFlavors[flavorId] = option;
    this.setData({ selectedFlavors });
  },

  // 确认口味选择
  confirmFlavor: function() {
    const { currentDish, selectedFlavors } = this.data;
    const { dishList } = this.data;
    const index = dishList.findIndex(item => item.id === currentDish.id);
    
    if (index > -1) {
      dishList[index].count += 1;
      dishList[index].selectedFlavors = selectedFlavors;
      this.setData({ 
        dishList,
        showFlavorPopup: false,
        currentDish: null,
        selectedFlavors: {}
      });
      this.calculateTotal();
    }
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    e.stopPropagation();
  },

  // 增加数量
  addCount: function(e) {
    const { id } = e.currentTarget.dataset;
    const { dishList } = this.data;
    const index = dishList.findIndex(item => item.id === id);
    
    if (index > -1) {
      const dish = dishList[index];
      if (dish.flavors && dish.flavors.length > 0) {
        this.setData({
          showFlavorPopup: true,
          currentDish: dish,
          selectedFlavors: dish.selectedFlavors || {}
        });
      } else {
        dishList[index].count += 1;
        this.setData({ dishList });
        this.calculateTotal();
      }
    }
  },

  // 减少数量
  minusCount: function(e) {
    const { id } = e.currentTarget.dataset;
    const { dishList } = this.data;
    const index = dishList.findIndex(item => item.id === id);
    
    if (index > -1 && dishList[index].count > 0) {
      dishList[index].count -= 1;
      if (dishList[index].count === 0) {
        delete dishList[index].selectedFlavors;
      }
      this.setData({ dishList });
      this.calculateTotal();
    }
  },

  // 计算总价和总数量
  calculateTotal: function() {
    const { dishList } = this.data;
    let totalPrice = 0;
    let totalCount = 0;

    dishList.forEach(item => {
      if (item.count > 0) {
        totalPrice += item.price * item.count;
        totalCount += item.count;
        // 生成 selectedFlavorList
        if (item.selectedFlavors && Object.keys(item.selectedFlavors).length > 0) {
          item.selectedFlavorList = Object.keys(item.selectedFlavors).map(fid => {
            const flavorObj = (item.flavors || []).find(f => f.id == fid) || {};
            return {
              id: fid,
              name: flavorObj.name || '',
              value: item.selectedFlavors[fid]
            };
          });
        } else {
          item.selectedFlavorList = [];
        }
      } else {
        item.selectedFlavorList = [];
      }
    });

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      totalCount,
      dishList
    });
  },

  // 提交订单
  submitOrder: function() {
    const { dishList } = this.data;
    const selectedDishes = dishList.filter(item => item.count > 0);
    
    if (selectedDishes.length === 0) {
      wx.showToast({
        title: '请选择菜品',
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

    wx.request({
      url: 'http://localhost:8080/user/order',
      method: 'POST',
      header: {
        'token': token
      },
      data: {
        dishes: selectedDishes.map(item => ({
          id: item.id,
          count: item.count,
          flavors: item.selectedFlavors || {}
        }))
      },
      success: (res) => {
        if (res.data.code === 1) {
          wx.showToast({
            title: '订单提交成功',
            icon: 'success'
          });
          // 清空购物车
          const dishList = this.data.dishList.map(item => ({
            ...item,
            count: 0,
            selectedFlavors: {}
          }));
          this.setData({ dishList });
          this.calculateTotal();
        } else {
          wx.showToast({
            title: res.data.msg || '订单提交失败',
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

  // 显示订单详情
  showOrderDetail: function() {
    this.setData({
      showOrderDetail: true
    });
  },

  // 隐藏订单详情
  hideOrderDetail: function() {
    this.setData({
      showOrderDetail: false
    });
  }
}); 