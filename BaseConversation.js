import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TouchableWithoutFeedback,
    TouchableHighlight,
    PushNotificationIOS,
    Dimensions,
    Vibration,
} from 'react-native';


import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import moment from 'moment/min/moment-with-locales.min';
var SQLite = require('react-native-sqlite-storage');
var SearchBar = require('react-native-search-bar');
var Sound = require('react-native-sound');

import {setMessages, addMessage, ackMessage} from './chat/actions'

import {
    setConversations,
    setUnread,
    addConversation,
    updateConversation
} from "./actions";
import {setConversation} from './actions';
import {MESSAGE_FLAG_ACK, MESSAGE_FLAG_FAILURE} from './chat/IMessage';

var IMService = require("./chat/im");

import ConversationDB from './model/ConversationDB';
import ProfileDB from "./model/ProfileDB";
import SyncKeyDB from './model/SyncKeyDB';
import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';
import GroupDB from './group/GroupDB';

import {SDK_API_URL} from './config';
import {CONVERSATION_GROUP, CONVERSATION_PEER} from './IConversation';

const screen = Dimensions.get('window');
const WIDTH = screen.width;
const HEIGHT = screen.height;

const ROW_HEIGHT = 64;

export default class BaseConversation extends React.Component {

    static navigatorButtons = {
        rightButtons: [
            {
                title: '+', 
                id: 'new', 
                showAsAction: 'ifRoom' 
            },
        ]
    };
    
    constructor(props) {
        super(props);
        
        this.contacts = [];
        this.groups = [];

        this.lastVibrateTS = 0;
        this.contentOffset = {x:0, y:0};
        this.tabCount = 0;
        this.searchBarHeight = 0;
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    onNavigatorEvent(event) {
        console.log("event:", event, event.type);
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'new') {
                var navigator = this.props.navigator;
                navigator.push({
                    title:"Chat",
                    screen:"group.GroupSelectMember",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        users:this.contacts
                    },
                });                
            }
        } else {
            if (event.id == 'bottomTabSelected') {
                console.log("bottom tab selected");
                this.tabCount++;
                if (this.tabCount == 2) {
                    //double click tab;
                    this.tabCount = 0;
                    this.onTabDoubleClick();
                } else if (this.tabCount == 1) {
                    setTimeout(() => {
                        this.tabCount = 0;
                    }, 200);
                }
            }
        }
    }

    getRowContentOffset(row) {
        return ROW_HEIGHT*row + this.searchBarHeight;
    }
    
    onTabDoubleClick() {
        console.log("tab double click");
        var index = -1;
        for (var i = 0; i < this.props.conversations.length; i++) {
            var conv = this.props.conversations[i];
            if (conv.unread > 0) {
                if (this.getRowContentOffset(i) > this.contentOffset.y) {
                    index = i;
                    break;
                }
            }
        }

        if (index == -1) {
            for (var i = 0; i < this.props.conversations.length; i++) {
                var conv = this.props.conversations[i];
                if (conv.unread > 0) {
                    index = i;
                    break;
                }
            } 
        }

        if (index == -1) {
            return;
        }

        if (this.getRowContentOffset(index) != this.contentOffset.y) {
            this.listView.scrollTo({y:this.getRowContentOffset(index), animated:true});
        }
    }

    onScroll(event) {
        var {
            contentSize,
            contentInset,
            contentOffset,
            layoutMeasurement,
        } = event.nativeEvent;

        this.contentOffset = contentOffset;
    }

    //播放消息的提示音
    playMessageSound() {
        var now = new Date();
        now = now.getTime();
        //一秒内不能震动多次
        if ((now - this.lastVibrateTS) < 1000) {
            return;
        }

        this.lastVibrateTS = now;
        var pattern;
        if (Platform.OS === 'android') {
            pattern = [0, 500, 200, 500];
        } else {
            pattern = [0, 1000, 2000, 3000];
        }
        
        Vibration.vibrate(pattern);

        var player = new Sound("received.mp3", Sound.MAIN_BUNDLE);
        Sound.enable(true);
        player.prepare((error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }

            player.play((success)=> {
                player.stop();
                player.release();
            });
        });
    }
    
    handlePeerMessage(message) {
        console.log("handle peer message:", message, msgObj);
        var profile = ProfileDB.getInstance();
        message.flags = 0;
        
        var msgObj = JSON.parse(message.content);

        if (msgObj.text) {
            message.text = msgObj.text;
        } else if (msgObj.image2) {
            message.image = msgObj.image2
        } else if (msgObj.audio) {
            message.audio = msgObj.audio;
        } else if (msgObj.location) {
            message.location = msgObj.location;
        }
        message.uuid = msgObj.uuid;
        
        var t = new Date();
        t.setTime(message.timestamp*1000);
        message.createdAt = t;
        message.user = {
            _id: message.sender
        }
        message.outgoing = (this.uid == message.sender);
        
        var peer = (this.uid == message.sender) ? message.receiver : message.sender;
        message.peer = peer;
        
        var db = PeerMessageDB.getInstance();
        db.insertMessage(message, peer)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              RCTDeviceEventEmitter.emit('peer_message', message);
          })
          .catch((err) => {
              console.log("db err:", err);
          })

        cid = "p_" + peer;
        var index = this.props.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        
        var conv;
        if (index != -1) {
            var c = this.props.conversations[index];
            var newConv = Object.assign({}, c);
            if (profile.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
                ConversationDB.getInstance().setUnread(newConv.cid, newConv.unread);
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_PEER,
                peer:peer,
                name:cid,
                timestamp:message.timestamp,
                unread:0,
                message:message,
            };
            var c = this.contacts.find((c)=> {
                return (c.id == conv.peer);
            })
            if (c) {
                conv.name = c.name;
            }
            if (profile.uid != message.sender) {
                conv.unread = 1;
                ConversationDB.getInstance().setUnread(conv.cid, conv.unread);
            }
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        if (msgObj.text) {
            conv.content = msgObj.text;
        } else if (msgObj.image2) {
            conv.content = "一张图片";
        } else if (msgObj.audio) {
            conv.content = "语音"
        } else if (msgObj.location) {
            conv.content = "位置";
        } else {
            conv.content = "";
        }
        
        console.log("new conv:", newConv);
        this.props.dispatch(updateConversation(conv, index));
        this.playMessageSound();
    }

    handleMessageACK(msg) {
        console.log("handle message ack:", msg);
        var db = PeerMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_ACK);
        RCTDeviceEventEmitter.emit('peer_message_ack', msg);
    }

    handleMessageFailure(msg) {
        var db = PeerMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_FAILURE);
        RCTDeviceEventEmitter.emit('peer_message_failure', msg);
    }
    
    handleGroupMessage(message) {
        console.log("handle group message:", message, msgObj);
        var profile = ProfileDB.getInstance();
        
        message.flags = 0;
        
        var msgObj = JSON.parse(message.content);

        if (msgObj.text) {
            message.text = msgObj.text;
        } else if (msgObj.image2) {
            message.image = msgObj.image2
        } else if (msgObj.audio) {
            message.audio = msgObj.audio;
        } else if (msgObj.location) {
            message.location = msgObj.location;
        }
        message.uuid = msgObj.uuid;
        
        var t = new Date();
        t.setTime(message.timestamp*1000);
        message.createdAt = t;
        message.user = {
            _id: message.sender
        }
        message.outgoing = (this.uid == message.sender);
        
        var db = GroupMessageDB.getInstance();
        db.insertMessage(message)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              RCTDeviceEventEmitter.emit('group_message', message);
          })
          .catch((err) => {
              console.log("db err:", err);
          });

        var cid =  "g_" + message.receiver;
        var groupID = message.receiver;
        var index = this.props.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });
        var conv;
        if (index != -1) {
            var c = this.props.conversations[index];
            var newConv = Object.assign({}, c);
            if (profile.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
                ConversationDB.getInstance().setUnread(newConv.cid, newConv.unread);
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_GROUP,
                groupID:groupID,
                name:cid,
                timestamp:message.timestamp,
                unread:0,
                message:message,
            };

            var group = this.groups.find((group)=> {
                return group.id == conv.groupID;
            });
            if (group) {
                conv.name = group.name;
            }
       
            if (profile.uid != message.sender) {
                conv.unread = 1;
                ConversationDB.getInstance().setUnread(conv.cid, conv.unread);
            }
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        if (msgObj.text) {
            conv.content = msgObj.text;
        } else if (msgObj.image2) {
            conv.content = "一张图片";
        } else if (msgObj.audio) {
            conv.content = "语音"
        } else if (msgObj.location) {
            conv.content = "位置";
        } else {
            conv.content = "";
        }

        //index==-1 表示添加
        console.log("new conv:", newConv);
        this.props.dispatch(updateConversation(conv, index));
        this.playMessageSound();
    }

    handleGroupMessageACK(msg) {
        console.log("handle group message ack");
        var db = GroupMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_ACK);
        RCTDeviceEventEmitter.emit('group_message_ack', msg);
    }

    handleGroupMessageFailure(msg) {
        var db = GroupMessageDB.getInstance();
        db.updateFlags(msg.id, MESSAGE_FLAG_FAILURE);
        RCTDeviceEventEmitter.emit('group_message_failure', msg);
    }

    handleGroupNotification(msg) {
        var profile = ProfileDB.getInstance();
        
        console.log("group notification:", msg);
        var obj = JSON.parse(msg);
        
        var db = GroupDB.getInstance();
        var notification = "";
        var timestamp = 0;
        var groupID = 0;
        var groupName = "";
        if (obj.create) {
            groupID = obj.create.group_id;
            timestamp = obj.create.timestamp;
            groupName = obj.create.name;
            db.insertGroup({id:obj.create.group_id,
                            name:obj.create.name,
                            master:obj.create.master,
                            timestamp:obj.create.timestamp,
                            members:obj.create.members});

            if (obj.create.master == this.uid) {
                notification = `您创建了${obj.create.name}群组`;
            } else {
                notification = `您加入了${obj.create.name}群组`;
            }

            var group = {
                id:groupID,
                name:groupName,
                timestamp:timestamp,
                master:obj.create.master
            };
            this.groups.push(group);
        } else if (obj.add_member) {
            groupID = obj.add_member.group_id;
            timestamp = obj.add_member.timestamp;
            groupName = obj.add_member.name;            
            db.addGroupMember(obj.add_member.group_id, obj.add_member.member_id);
            notification = `${obj.add_member.name}加入群`;
        } else if (obj.quit_group) {
            groupID = obj.quit_group.group_id;
            timestamp = obj.quit_group.timestamp;
            groupName = obj.quit_group.name;
            db.removeGroupMember(obj.quit_group.group_id, obj.quit_group.member_id);
            notification = `${obj.quit_group.name}离开群`;
        } else if (obj.disband) {
            groupID = obj.disband.group_id;
            timestamp = obj.disband.timestamp;
            groupName = obj.disband.name;
            db.disbandGroup(obj.disband.group_id);
            notification = "群组已解散";
        } else if (obj.update_name) {
            groupID = obj.update_name.group_id;
            timestamp = obj.update_name.timestamp;
            groupName = obj.update_name.name;
            db.updateName(groupID, groupName);
            //更新内存中的群组名称
            var group = this.groups.find((group) => {
                return group.id == groupID;
            });
            if (group) {
                group.name = groupName;
            }
            notification = `群组更名为${groupName}`;
        }
        
        console.log("group notification:", notification);

        var message = {};
        message.groupID = groupID;
        message.sender = 0;
        message.receiver = groupID;
        message.flags = 0;
        message.notification = notification;
        message.uuid = "";
        message.timestamp = timestamp;
        message.content = JSON.stringify({uuid:"", notification:notification});
        
        var t = new Date();
        t.setTime(message.timestamp*1000);
        message.createdAt = t;
        message.user = {
            _id: 0
        }
        message.outgoing = false;
        
        var db = GroupMessageDB.getInstance();
        db.insertMessage(message)
          .then((rowid) => {
              message.id = rowid;
              message._id = rowid;
              RCTDeviceEventEmitter.emit('group_message', message);
          })
          .catch((err) => {
              console.log("db err:", err);
          });

        var cid =  "g_" + message.receiver;
        var index = this.props.conversations.findIndex((conv) => {
            return conv.cid == cid;
        });

        var conv;
        if (index != -1) {
            var c = this.props.conversations[index];
            var newConv = Object.assign({}, c);
            if (profile.uid != message.sender) {
                newConv.unread = newConv.unread + 1;
            }
            conv = newConv;
        } else {
            conv = {
                cid:cid,
                type:CONVERSATION_GROUP,
                groupID:groupID,
                name:groupName,
                timestamp:message.timestamp,
                unread:1,
                message:message,
            };
        }

        conv.message = message;
        conv.timestamp = message.timestamp;
        conv.content = notification;
        conv.name = groupName;
        this.props.dispatch(updateConversation(conv, index));
    }

    loadConversations() {
        var db = PeerMessageDB.getInstance();
        var profile = ProfileDB.getInstance();

        var p1 = db.getConversations()
                   .then((messages) => {
                       var convs = [];
                       for (var i in messages) {
                           var m = messages[i];
                           console.log("m:", m, "uid:", profile.uid);
                           var peer = (m.sender == profile.uid) ? m.receiver : m.sender;
                           var cid = "p_" + peer;
                           var conv = {
                               cid:cid,
                               type:CONVERSATION_PEER,
                               peer:peer,
                               name:cid,
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                           }
                           var msgObj = JSON.parse(m.content);
                           if (msgObj.text) {
                               conv.content = msgObj.text;
                           } else if (msgObj.image2) {
                               conv.content = "一张图片";
                           } else if (msgObj.audio) {
                               conv.content = "语音"
                           } else if (msgObj.location) {
                               conv.content = "位置";
                           } else {
                               conv.content = "";
                           }
                           
                           convs = convs.concat(conv);
                       }

                       console.log("conversations:", convs);
                       return convs;

                   });


        db = GroupMessageDB.getInstance();
        
        var p2 = db.getConversations()
                   .then((messages) => {
                       var convs = [];
                       for (var i in messages) {
                           var m = messages[i];
                           m.receiver = m.group_id;
                           
                           var cid = "g_" + m.receiver;
                           var conv = {
                               cid:cid,
                               type:CONVERSATION_GROUP,
                               groupID:m.receiver,
                               name:cid,
                               timestamp:m.timestamp,
                               unread:0,
                               message:m,
                           }
                           var msgObj = JSON.parse(m.content);
                           if (msgObj.text) {
                               conv.content = msgObj.text;
                           } else if (msgObj.image2) {
                               conv.content = "一张图片";
                           } else if (msgObj.audio) {
                               conv.content = "语音"
                           } else if (msgObj.location) {
                               conv.content = "位置";
                           } else if (msgObj.notification) {
                               conv.content = msgObj.notification;
                           } else {
                               conv.content = "";
                           }
                           
                           convs = convs.concat(conv);
                       }

                       console.log("conversations:", convs);
                       return convs
                   });
        
        Promise.all([p1, p2])
               .then((results) => {
                   var convs = results[0].concat(results[1]);
                   return convs;
               }).then((convs) => {
                   var ps = convs.map((conv)=> {
                       return ConversationDB.getInstance().getUnread(conv.cid)
                   });
                   return Promise.all([convs].concat(ps));
               }).then((results) => {
                   var newCount = 0;
                   var convs = results[0];
                   for (var i = 0; i < convs.length; i++) {
                       var conv = convs[i];
                       conv.unread = results[i+1];
                       newCount += conv.unread;

                       if (conv.type == CONVERSATION_GROUP) {
                           var group = this.groups.find((group)=> {
                               return group.id == conv.groupID;
                           });
                           if (group) {
                               conv.name = group.name;
                           }

                       } else if (conv.type == CONVERSATION_PEER) {
                           var c = this.contacts.find((c)=> {
                               return (c.id == conv.peer);
                           })
                           if (c) {
                               conv.name = c.name;
                           }
                       }
                   }

                   //order by timestamp descend
                   convs = convs.sort((a, b) => {
                       if (a.timestamp < b.timestamp) {
                           return 1;
                       } else if (a.timestamp == b.timestamp) {
                           return 0;
                       } else {
                           return -1;
                       }
                   });
                   
                   this.props.dispatch(setConversations(convs));
               }).catch((err) => {
                   console.log("err:", err);
               });
        
    }
    
    componentWillMount() {
        var profile = ProfileDB.getInstance();
        
        this.listener = RCTDeviceEventEmitter.addListener('set_contacts', (contacts) => {
            this.contacts = contacts;
            var convs = this.props.conversations;
            convs = convs.map((conv)=> {
                if (conv.type == CONVERSATION_GROUP) {
                    return conv;
                }
                var c = this.contacts.find((c)=> {
                    return (c.id == conv.peer);
                })
                if (c) {
                    conv.name = c.name;
                }
                return conv;
            });
            this.props.dispatch(setConversations(convs));
        });
        
        var im = IMService.instance;
        im.accessToken = profile.gobelieveToken;
        im.addObserver(this);
        
        var groupDB = GroupDB.getInstance();
        var syncKeyDB = SyncKeyDB.getInstance();
        
        var p1 = groupDB.getGroups();
        var p2 = syncKeyDB.getMessageSyncKey();

        Promise.all([p1, p2])
               .then((results) => {
                   this.groups = results[0];
                   console.log("groups:", this.groups);
                   if (this.groups.length == 0) {
                       //首次登录，从服务器获取全部群组
                       this.updateGroup();
                   }
                   
                   im.syncKey = results[1];

                   this.groups.forEach((group) => {
                       if (group.syncKey != -1) {
                           im.addSuperGroupSyncKey(group.id, group.syncKey);
                       }
                   });

                   im.start();
               })
               .then(() => {
                   this.loadConversations();
               });
        
        this.uid = profile.uid;
        this.name = profile.name;
        this.accessToken = profile.accessToken;
        this.refreshToken = profile.refreshToken;
        this.expires = profile.expires;
    }

    updateGroup() {
        var self = this;
        var url = SDK_API_URL + "/client/groups?fields=members";
        var profile = ProfileDB.getInstance();
        var accessToken = profile.gobelieveToken;
        var groupDB = GroupDB.getInstance();

        console.log("get all groups...");
        fetch(url, {
            method:"GET",  
            headers: {
                'Accept': 'application/json',
                "Authorization": "Bearer " + accessToken
            },
        }).then((response) => {
            return Promise.all([response.status, response.json()])
        }).then((results) => {
            var status = results[0];
            var r = results[1];
            
            console.log("group response:", r);
            if (status != 200) {
                console.log("get groups err:", r);
                return;
            } else {
                var groups = r.data;
                groups.forEach((group) => {
                    group.timestamp = 0;
                    groupDB.insertGroup(group);

                    
                });
                this.groups = groups;
                var convs = this.props.conversations;
                if (convs) {
                    convs = convs.map((conv)=> {
                        if (conv.type == CONVERSATION_GROUP) {
                            var group = this.groups.find((group) => {
                                return conv.groupID == group.id;
                            });

                            if (group) {
                                conv.name = group.name;
                            }
                        }
                        return conv;
                    });
                    
                    this.props.dispatch(setConversations(convs));
                }
            }
        }).catch((error) => {
            console.log("error:", error);

        });
        
    }
    
    setApplicationIconBadgeNumber(newCount) {
        var badge = {badge:newCount ? newCount : null, tabIndex:0};
        this.props.navigator.setTabBadge(badge);
    }

    componetWillUnmount() {
        var im = IMService.instance;
        im.removeObserver(this);
        im.stop();

        this.listener.remove();
    }
    
    componentWillReceiveProps(nextProps) {
        if (this.props.conversations === nextProps.conversations) {
            return;
        }
        var oldNewCount = 0;
        var newCount = 0;
        this.props.conversations.forEach((conv) => {
            oldNewCount += conv.unread;
        })
        
        nextProps.conversations.forEach((conv) => {
            newCount += conv.unread;
        });

        if (oldNewCount != newCount) {
            this.setApplicationIconBadgeNumber(newCount);
        }
        
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(nextProps.conversations),
        });
    }
    
    renderRow(conv) {
        var self = this;
        var navigator = this.props.navigator;
        var profile = ProfileDB.getInstance();
        function onPress() {
            console.log("row data:", conv);

            if (conv.cid.startsWith("p_")) {
                var uid = parseInt(conv.cid.substr(2));
                console.log("uid:", profile.uid, uid);
                navigator.push({
                    title:conv.name,
                    screen:"chat.PeerChat",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        sender:profile.uid,
                        receiver:uid,
                        peer:uid,
                        name:conv.name,
                        token:profile.gobelieveToken,
                    },
                });
            } else if (conv.cid.startsWith("g_")) {
                var gid = parseInt(conv.cid.substr(2));
                navigator.push({
                    title:conv.name,
                    screen:"chat.GroupChat",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        sender:profile.uid,
                        receiver:gid,
                        groupID:gid,
                        name:conv.name,
                        token:profile.gobelieveToken,
                        contacts:self.contacts,
                    },
                });                
            }
        }

        var t = new Date();
        t = t.setTime(conv.timestamp*1000);

        var renderUnread = function() {
            if (conv.unread > 0) {
                return (
                    <View style={{backgroundColor:"red",
                                  position:"absolute",
                                  left:32,
                                  top:0,
                                  width:16,
                                  height:16,
                                  borderRadius:90,
                                  alignItems:"center",
                                  justifyContent:"center"}}>
                        <Text style={{fontSize:8}}>
                            {"" + conv.unread}
                        </Text>
                    </View>
                );
            } else {
                return null;
            }
        }

        return (
            <TouchableHighlight
                style={{flex:1, height:64, backgroundColor:"white"}}
                activeOpacity={0.6}
                underlayColor={"gray"}
                onPress={onPress}>
                <View style={{flex:1}}>

                    <View style={{flex:1,
                                  height:64,
                                  flexDirection:"row",
                                  alignItems:"center"}}>

                        <View style={{marginLeft:12, width:48, height:48}}>
                            <Image style={{ position:"absolute",
                                            left:0,
                                            top:8,
                                            width:40,
                                            height:40}}
                                   source={require("./Images/default.png")}/>
                            
                            {renderUnread()}
                        </View>
                        <View style={{flex:1, height:40, marginLeft:12}}>
                            <View style={{flex:1, flexDirection:"row",  justifyContent: 'space-between'}}>
                                <Text style={{fontWeight:"bold"}}>
                                    {conv.name}
                                </Text>
                                <Text style={{fontWeight:"100", fontSize:12, marginRight:8}}>
                                    {moment(t).locale('zh-cn').format('LT')}
                                </Text>
                            </View>
                            <Text>
                                {conv.content}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }
 

}
