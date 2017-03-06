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
} from 'react-native';


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
import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';
import GroupDB from './group/GroupDB';

import {SDK_API_URL} from './config';
import {CONVERSATION_GROUP, CONVERSATION_PEER} from './IConversation';

var Searchable = {
    //搜索结果
    onGroupMessages(messages) {
        console.log("group messages:", messages.length);
        var convs = messages.reduce((acc, message) => {
            var msgObj = JSON.parse(message.content);
            //搜索结果只会是文本消息
            if (msgObj.text) {
                message.text = msgObj.text;
            }
            message.uuid = msgObj.uuid;
            
            var groupID = message.group_id;
            var conv = acc.find((conv) => {
                return conv.groupID == groupID;
            });
            if (conv) {
                conv.count = conv.count + 1;
                conv.messages.push(message);
                return acc;
            } else {
                conv = {
                    type:CONVERSATION_GROUP,
                    groupID:groupID,
                    cid:"g_" + groupID,
                    count:1,
                    messages:[message]
                };
                var group = this.groups.find((group)=> {
                    return group.id == groupID;
                });
                if (group) {
                    conv.name = group.name;
                } else {
                    conv.name = "g_" + message.group_id;
                }                
                return acc.concat(conv);
            }
        }, []);
        return convs;
    },
    
    onPeerMessages(messages) {
        console.log("peer messages:", messages.length);
        var profile = ProfileDB.getInstance();

        var convs = messages.reduce((acc, message) => {
            var msgObj = JSON.parse(message.content);
            //搜索结果只会是文本消息
            if (msgObj.text) {
                message.text = msgObj.text;
            }
            message.uuid = msgObj.uuid;
            
            var peer = (message.sender == profile.uid ? message.receiver : message.sender);
            var conv = acc.find((conv) => {
                return (conv.peer == peer);
            });
            if (conv) {
                //关联的消息数目
                conv.count = conv.count + 1;
                conv.messages.push(message);
                return acc;
            } else {
                conv = {
                    type:CONVERSATION_PEER,
                    peer:peer,
                    cid:"p_" + peer,
                    count:1,
                    messages:[message]
                }
                var c = this.contacts.find((c)=> {
                    return (c.id == conv.peer);
                })
                if (c) {
                    conv.name = c.name;
                } else {
                    conv.name = "p_" + peer;
                }
                return acc.concat(conv);
            }
        }, []);
 
        return convs;
    },

    
    searchKey(text) {
        console.log("begin search:", text);
        if (!text) {
            return Promise.resolve([]);
        }
        
        var peerDB = PeerMessageDB.getInstance();
        var groupDB = GroupMessageDB.getInstance();
        return Promise.all([peerDB.search(text), groupDB.search(text)])
                      .then((results) => {
                          var convs1 = this.onPeerMessages(results[0]);
                          var convs2 = this.onGroupMessages(results[1]);
                          var convs = convs1.concat(convs2);
                          return convs;
                      });
    },

    
    renderSearchRow(conv) {
        var self = this;
        var navigator = this.props.navigator;
        var profile = ProfileDB.getInstance();
        function onPress() {
            console.log("row data:", conv);
            //self.cancelSearch();
            //must push after next run loop
            setTimeout(() => {
                navigator.push({
                    title:conv.name,
                    screen:"app.SearchResult",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        conv:conv,
                        searchText:self.state.searchText,
                    },
                });
            }, 0);
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
                            
                        
                        </View>
                        <View style={{flex:1, height:40, marginLeft:12}}>
                            <View style={{flex:1, flexDirection:"row",  justifyContent: 'space-between'}}>
                                <Text style={{fontWeight:"bold"}}>
                                    {conv.name}
                                </Text>
                            </View>
                            <Text>
                                {`${conv.count}相关聊天记录`}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );        
    },


    search() {
        if (this.searching) {
            return;
        }
        this.searching = true;
        var text = this.state.searchText;
        
        this.searchKey(text)
            .then((results) => {
                this.searching = false;
                this.setState({
                    searchDataSource:this.state.dataSource.cloneWithRows(results)
                });                    
                //在搜索过程中搜索输入框内的内容已经变化
                if (this.state.searchText != text) {
                    //递归调用
                    this.search();
                }
            });        
    },
}

module.exports = Searchable;
