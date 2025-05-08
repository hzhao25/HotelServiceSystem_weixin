Page({
  data: {
    logoUrl: '/assets/logo.png',
    activeMenu: 'delivery',  // 默认选中送货菜单
    activeSubmenu: 'food',   // 默认选中菜品选定
    currentSubContent: 'food', // 当前显示的内容
    isEmployee: false        // 是否是员工账号
  },

  onLoad: function() {
    // 检查用户登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      if (userInfo.role === 1) {
        this.setData({
          isEmployee: true
        });
      }
    }
  },

  onLogoError: function() {
    this.setData({
      logoUrl: '/assets/default_logo.png'  // 设置默认图片
    });
  },

  // 切换主菜单
  switchMenu: function(e) {
    const menu = e.currentTarget.dataset.menu;
    
    // 判断是否是员工账号
    if (this.data.isEmployee && (menu === 'service' || menu === 'delivery')) {
      wx.showToast({
        title: '员工账号无权限',
        icon: 'none'
      });
      return;
    }

    // 处理主菜单切换
    if (menu === 'service') {
      // 服务菜单默认选中清洁
      this.setData({
        activeMenu: menu,
        activeSubmenu: 'clean',
        currentSubContent: 'clean'
      });
    } else if (menu === 'delivery') {
      // 送货菜单默认选中菜品
      this.setData({
        activeMenu: menu,
        activeSubmenu: 'food',
        currentSubContent: 'food'
      });
    } else {
      this.setData({
        activeMenu: menu,
        currentSubContent: menu
      });
    }
  },

  // 切换子菜单
  switchSubmenu: function(e) {
    // 判断是否是员工账号
    if (this.data.isEmployee) {
      wx.showToast({
        title: '员工账号无权限',
        icon: 'none'
      });
      return;
    }

    const submenu = e.currentTarget.dataset.submenu;
    this.setData({
      activeSubmenu: submenu,
      currentSubContent: submenu
    });

    // 打印当前菜单状态，用于调试
    console.log(`当前主菜单: ${this.data.activeMenu}, 子菜单: ${submenu}`);
  }
}); 