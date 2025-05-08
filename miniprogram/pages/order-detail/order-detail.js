Page({
  data: {
    order: {}
  },
  onLoad(options) {
    // 支持直接传递订单对象（JSON字符串）或订单id
    if (options.order) {
      this.setData({ order: JSON.parse(decodeURIComponent(options.order)) });
    } else if (options.id) {
      // 通过id请求订单详情（可扩展）
      // 这里可根据实际需要请求后端接口获取订单详情
    }
  }
}); 