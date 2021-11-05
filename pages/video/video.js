// pages/video/video.js
import request from '../../utils/request'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [],
    navId: '58100',//导航的标识
    videoList: [],
    videoId: '',//视频id
    videoUpdateTime: [],//记录video播放的时长
    isTrigger: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(!wx.getStorageSync('userInfo')){
      wx.navigateTo({
        url: '/pages/login/login',
      })
    }else{
      this.getVideoGroupListData();
    }
  },

  changeNav: function(event){
      let navId = event.currentTarget.id;
      this.setData({
        navId,
        videoList: [],

      })
      //显示正在加载
      wx.showLoading({
        title: '正在加载',
        mask: true,
      })
      //动态获取当前导航对应的视频数据
      this.getVideoList(this.data.navId);
  },

  //获取导航数据
   getVideoGroupListData: async function(){
    let videoGroupListData = await request('/video/group/list');
    this.setData({
      videoGroupList: videoGroupListData.data.splice(0,14),
    })
    this.getVideoList(this.data.navId);
  },

  //跳转至搜索界面
  toSearch: function(){
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },

  getVideoList: async function(navId){
    if(!navId){
      return;
    }
    let videoListData = await request('/video/group',{id : navId});
    //关闭消息提示框
    wx.hideLoading();
    //关闭下拉刷新
    let index = 0;
    let videoList = videoListData.datas.map(item =>{
      item.id = index++;
      return item;
    });
    this.setData({
      videoList,
      isTrigger: false,
    })
  },

  handlePlay: function(event){
    let vid = event.currentTarget.id;
    /**
     * 多个视频可以同时播放的问题
     * 在点击播放事件中需要找到上一个播放的视频
     * 在播放新的视频之前关闭上一个正在播放的视频
     * 单例模式:
     * 1、需要创建多个对象的场景下,通过一个变量接收，始终保持只有一个对   象。
     * 2、节省内存空间
     */
    //关闭上一个播放的问题
    if(this.videoContext && this.vid != vid){
      this.videoContext.stop();
    }
    this.vid = vid;
    this.setData({
      videoId: vid,
    })
    //创建video标签的实例对象
    this.videoContext =  wx.createVideoContext(vid);
    //判断当前的视频是否有播放记录,如果有，跳转至指定的播放位置
    let videoItem = this.data.videoUpdateTime.find(item => item.vid === vid);
    if(videoItem){
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play();

  },

  handleTimeUpdate: function(event){
      let videoTimeObj = {
        vid: event.currentTarget.id,
        currentTime: event.detail.currentTime,
      };
      let {videoUpdateTime} = this.data;
      let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid)
      if(videoItem){//之前有
        videoItem.currentTime = videoTimeObj.currentTime;
      }else{
        videoUpdateTime.push(videoTimeObj);
      }
      this.setData({
        videoUpdateTime
      })

  },

  handleEnded: function(event){
    //移除记录播放时长数组中当前视频的对象
    let vid = event.currentTarget.id;
    let {videoUpdateTime} = this.data;
    let videoItemIndex = videoUpdateTime.findIndex(item => item.vid === vid);
    videoUpdateTime.splice(videoItemIndex,1);
    this.setData({
      videoUpdateTime
    });
  },
  handleRefresher: function(event){
      console.log("下拉刷新");
      this.getVideoList(this.data.navId);
  },
  handleTolower: function(){
    //...分割符

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("页面的下拉刷新!");
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("页面的上拉触底!");
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
      if(from === 'button'){
        return {
          title: '云音乐_button',
          page: '/pages/video/video',
          imageUrl:'/static/images/animal.jpg'
      }
    }else{
      return {
        title: '云音乐_menu',
        page: '/pages/video/video',
        imageUrl:'/static/images/animal.jpg'
      }
    }
  }
})