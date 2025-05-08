Component({
  data: {
    productList: [],
    totalPrice: 0,
    totalCount: 0,
    showCart: false,
    showOrderDetail: false
  },

  lifetimes: {
    attached() {
      this.getProductList();
    }
  },

  methods: {
    getProductList: function() {
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
        url: 'http://localhost:8080/user/product',
        method: 'GET',
        header: {
          'authentication': token
        },
        success: (res) => {
          console.log('商品数据响应：', res.data);
          if (res.data.code === 1) {
            const productList = res.data.data
              .filter(product => product.status === 1 && product.stock > 0)
              .map(product => ({
                ...product,
                count: 0
              }));
            console.log('处理后的商品列表：', productList);
            this.setData({ productList });
          } else {
            wx.showToast({
              title: '获取商品失败',
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
    
    addCount: function(e) {
      const { id } = e.currentTarget.dataset;
      const { productList } = this.data;
      const index = productList.findIndex(item => item.id === id);
      
      if (index > -1) {
        const product = productList[index];
        if (product.count >= product.stock) {
          wx.showToast({
            title: '库存不足',
            icon: 'none'
          });
          return;
        }
        productList[index].count += 1;
        this.setData({ productList });
        this.calculateTotal();
      }
    },

    minusCount: function(e) {
      const { id } = e.currentTarget.dataset;
      const { productList } = this.data;
      const index = productList.findIndex(item => item.id === id);
      
      if (index > -1 && productList[index].count > 0) {
        productList[index].count -= 1;
        this.setData({ productList });
        this.calculateTotal();
      }
    },

    calculateTotal: function() {
      const { productList } = this.data;
      let totalPrice = 0;
      let totalCount = 0;

      productList.forEach(item => {
        if (item.count > 0) {
          totalPrice += item.price * item.count;
          totalCount += item.count;
        }
      });

      this.setData({
        totalPrice: totalPrice.toFixed(2),
        totalCount
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
    },

    submitOrder: function() {
      const { productList } = this.data;
      const selectedProducts = productList.filter(item => item.count > 0);
      
      if (selectedProducts.length === 0) {
        wx.showToast({
          title: '请选择商品',
          icon: 'none'
        });
        return;
      }

      wx.setStorageSync('cartItems', selectedProducts);

      wx.navigateTo({
        url: '/pages/product-checkout/product-checkout',
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
    }
  }
});