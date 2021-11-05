// pages/songDetail/songDetail.js
import moment from 'moment'
import PubSub from 'pubsub-js'
import request from '../../../utils/request'
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,//音乐是否播放
    musicId: '',
    song: {},//歌曲详情
    musicLinked: '',//音乐链接
    currentTime: '00:00',//实时时间
    durationTime: '00.00',//总时长
    currentWidth: 0,//实时进度条的宽度
  },

  //点击播放/暂停的回调
  musicPlay: function(){
    let isPlay =  !this.data.isPlay;
    // this.setData({
    //   isPlay
    // })
    let {musicId,musicLinked} = this.data;
    this.musicControl(isPlay,musicId,musicLinked);
  },

  //功能函数
  musicControl: async function(isPlay,musicId,musicLinked){
    if(isPlay){//音乐播放
      if(!musicLinked){
        let musicLinkData = await request('/song/url',{id: musicId});
        let musicLink =musicLinkData.data[0].url;
        this.setData({
          musicLinked: musicLink,
        })
      }
      //创建控制音乐播放的实例对象
      this.backGroundAudio.src = this.data.musicLinked;
      this.backGroundAudio.title = this.data.song.name;
    }else{//音乐暂停
      this.backGroundAudio.pause();
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //options:用于接收路由跳转的query参数
    //原生小程序中路由传参，对参数的长度有限制,如果参数长度过长会自动截取掉。
    let musicId = options.musicId;
    this.setData({
      musicId
    })
    this.getMusicInfo(musicId);

    /**
     * 问题:如果用户操作系统的控制音乐播放/暂停的按钮，导致页面显示是否播放的状态和真实的音乐播放状态不一致。
     * 解决方案:
     *  1、通过控制音频的实例去监视音乐播放/暂停
     */
    //判断当前的音乐是否之前播放过
    if(appInstance.globalData.isMusicPlay && appInstance.globalData.musicId == musicId){
      //修改当前页面音乐播放状态为true
      this.setData({
        isPlay: true,
      });
    }
    //监视音乐
    this.backGroundAudio = wx.getBackgroundAudioManager();
    this.backGroundAudio.onPlay(()=>{
      //修改音乐是否的状态
      this.changePlayState(true);
      appInstance.globalData.musicId = this.data.musicId;
    });
    this.backGroundAudio.onPause(()=>{
      //修改音乐是否的状态
      this.changePlayState(false);
    });
    this.backGroundAudio.onStop(()=>{
      //修改音乐是否的状态
      this.changePlayState(false);
    });
    //监听音乐实时播放的进度
    this.backGroundAudio.onTimeUpdate(()=>{
      //格式化实时的播放时间
      let currentTime = moment(this.backGroundAudio.currentTime * 1000).format('mm:ss');
      let currentWidth = (this.backGroundAudio.currentTime / this.backGroundAudio.duration) * 450;
      this.setData({
        currentTime,
        currentWidth,
      })
    });

    //监听音乐播放自然结束
    this.backGroundAudio.onEnded(()=>{
      //自动切换下一首音乐,并且自动播放
      PubSub.publish('switchType','next');
      //将实时进度条的长度还原成0;时间还原成0
      this.setData({
        currentWidth: 0,
        currentTime: '00:00',
      })
    });
  },
  //修改播放状态的功能函数
  changePlayState: function(isPlay){
    this.setData({
      isPlay
    })
    appInstance.globalData.isMusicPlay = isPlay;
  },

  //获取音乐详情的功能函数
  getMusicInfo: async function(musicId){
    let songData = await request('/song/detail',{ids: musicId});
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    this.setData({
      song: songData.songs[0],
      durationTime,
    })
    wx.setNavigationBarTitle({
      title: this.data.song.name,
    })
  },
  
  handleSwitch: function(event){
    //获取切换的类型
    let type = event.currentTarget.id;
    this.backGroundAudio.stop();
    PubSub.subscribe('musicId',(msg,musicId)=>{
      this.getMusicInfo(musicId);
      this.setData({
        musicId,
        currentWidth: 0,
      })
      this.musicControl(true,musicId);
      PubSub.unsubscribe('musicId');
    })
    //发布消息数据给recommendSong页面
    PubSub.publish('switchType',type);
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})