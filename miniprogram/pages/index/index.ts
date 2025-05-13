Page({
  data: {
    activeMenu: 'service', // 当前选中的主菜单
    activeSubmenu: 'clean', // 当前选中的子菜单
    logoUrl: 'https://readdy.ai/api/search-image?query=luxury%20hotel%20logo%20design%2C%20minimalist%2C%20green%20and%20gold%20color%20scheme%2C%20elegant%20geometric%20shapes%2C%20hospitality%20symbol%2C%20hotel%20service%20icon%2C%20professional%20branding%2C%20isolated%20on%20white%20background%2C%20centered%20composition%2C%20high%20quality%203D%20rendering&width=200&height=200&seq=logo123&orientation=squarish',
    currentSubContent: '', // 新增，控制右侧内容区
    isEmployee: false, // 是否是员工
    shopOpen: true,     // 店铺是否营业中
    shopStatus: 1 as number | null   // 店铺状态，1为营业中，0为打烊
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.type === 'employee') {
      this.setData({
        isEmployee: true
      });
    }
    
    // 获取店铺营业状态
    this.getShopStatus();
  },
  
  onShow() {
    // 每次进入页面时重新获取店铺状态
    this.getShopStatus();
  },

  // 图片加载失败处理
  onLogoError() {
    wx.showToast({
      title: 'logo加载失败',
      icon: 'none'
    });
  },
  
  // 获取店铺营业状态
  getShopStatus() {
    const token = wx.getStorageSync('token');
    wx.request({
      url: 'http://localhost:8080/user/shop/status',
      method: 'GET',
      header: {
        'authentication': token
      },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult<{code: number, data: number, msg: string}>) => {
        if (res.data && res.data.code === 1) {
          const status = res.data.data;
          this.setData({
            shopStatus: status,
            shopOpen: status === 1 // 1为营业中，0为打烊
          });
        } else {
          // 默认设置为营业中
          this.setData({
            shopStatus: 1,
            shopOpen: true
          });
        }
      },
      fail: () => {
        // 请求失败时默认设置为营业中
        this.setData({
          shopStatus: 1,
          shopOpen: true
        });
      }
    });
  },

  // 切换主菜单
  switchMenu(e: WechatMiniprogram.TouchEvent) {
    const menu = e.currentTarget.dataset.menu;
    
    // 如果店铺已打烊，不允许点击
    if (!this.data.shopOpen) {
      wx.showToast({
        title: '店铺已打烊',
        icon: 'none'
      });
      return;
    }
    
    // 如果是员工，只允许点击紧急呼叫
    if (this.data.isEmployee && menu !== 'emergency') {
      wx.showToast({
        title: '员工账号无权限',
        icon: 'none'
      });
      return;
    }
    this.setData({
      activeMenu: menu,
      activeSubmenu: '' // 切换主菜单时清空子菜单选中状态
    });
  },

  // 切换子菜单
  switchSubmenu: function(e: WechatMiniprogram.TouchEvent) {
    // 如果店铺已打烊，不允许点击
    if (!this.data.shopOpen) {
      wx.showToast({
        title: '店铺已打烊',
        icon: 'none'
      });
      return;
    }
    
    // 如果是员工，不允许切换子菜单
    if (this.data.isEmployee) {
      wx.showToast({
        title: '员工账号无权限',
        icon: 'none'
      });
      return;
    }
    const submenu = e.currentTarget.dataset.submenu;
    if (submenu === 'food') {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: 'food'
      });
    } else if (submenu === 'supplies') {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: 'supplies'
      });
    } else if (submenu === 'goods') {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: 'goods'
      });
    } else if (submenu === 'clean') {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: 'clean'
      });
    } else if (submenu === 'repair') {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: 'repair'
      });
    } else {
      this.setData({
        activeSubmenu: submenu,
        currentSubContent: ''
      });
    }
  }
});
