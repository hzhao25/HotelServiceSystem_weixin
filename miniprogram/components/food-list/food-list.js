Component({
  data: {
    dishList: [],
    totalPrice: 0,
    totalCount: 0,
    showFlavorPopup: false,
    currentDish: null,
    selectedFlavors: {},
    showOrderDetail: false,
    totalAmount: 0,
    showCart: false
  },
  lifetimes: {
    attached() {
      this.getDishList();
    }
  },
  methods: {
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
            const dishList = res.data.data
              .filter(dish => dish.status === 1)
              .map(dish => ({
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
    hideFlavorPopup: function() {
      this.setData({
        showFlavorPopup: false,
        currentDish: null,
        selectedFlavors: {}
      });
    },
    selectFlavor: function(e) {
      const { flavorId, option } = e.currentTarget.dataset;
      const selectedFlavors = { ...this.data.selectedFlavors };
      selectedFlavors[flavorId] = option;
      this.setData({ selectedFlavors });
    },
    confirmFlavor: function() {
      const { currentDish, selectedFlavors, dishList } = this.data;
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
    calculateTotal: function() {
      const { dishList } = this.data;
      let totalPrice = 0;
      let totalCount = 0;
      dishList.forEach(item => {
        if (item.count > 0) {
          totalPrice += item.price * item.count;
          totalCount += item.count;
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
    submitOrder: function() {
      const { dishList } = this.data;
      const selectedDishes = dishList.filter(item => item.count > 0);
      
      console.log('选中的菜品：', selectedDishes);
      
      if (selectedDishes.length === 0) {
        wx.showToast({
          title: '请选择菜品',
          icon: 'none'
        });
        return;
      }

      // 保存购物车数据
      wx.setStorageSync('cartItems', selectedDishes);
      console.log('购物车数据已保存');

      // 跳转到结算页面
      wx.navigateTo({
        url: '/pages/checkout/checkout',
          success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败：', err);
            wx.showToast({
            title: '跳转失败',
              icon: 'none'
            });
        }
      });
    },
    showOrderDetail: function() {
      this.setData({
        showOrderDetail: true
      });
    },
    hideOrderDetail: function() {
      this.setData({
        showOrderDetail: false
      });
    }
  }
}); 