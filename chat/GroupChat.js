import React from 'react';
import {
    Platform,
} from 'react-native';

import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import {AudioUtils} from 'react-native-audio';

import GroupMessageDB from './GroupMessageDB.js'
import {
    setMessages,
    addMessage,
    addMessages,
    insertMessages,
    ackMessage,
    failMessage
} from './actions';

import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED} from './IMessage';

var IMService = require("./im");

import Chat from './Chat';

export class BaseGroupChat extends Chat {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        super.componentWillMount();
        
        var im = IMService.instance;
        im.addObserver(this);

        var f1 = (message) => {
            if (message.receiver == this.props.groupID) {
                this.downloadAudio(message);
                this.props.dispatch(addMessage(message));
                this.scrollToBottom();
            }
        }
        this.listener = RCTDeviceEventEmitter.addListener('group_message', f1);

        var f2 = (message)=>{
            if (message.receiver == this.props.groupID) {
                this.props.dispatch(ackMessage(message.id));
            }
        }
        this.ackListener = RCTDeviceEventEmitter.addListener('group_message_ack', f2);

        var f3 = (message) => {
            if (message.receiver == this.props.groupID) {
                this.props.dispatch(failMessage(message.id));
            }
        }
        this.failListener =  RCTDeviceEventEmitter.addListener('group_message_failure', f3);
        
        var db = GroupMessageDB.getInstance();

        if (this.props.messageID) {
            //从搜索页面跳转来, 查看某一条消息
            var p1 = db.getEarlierMessages(this.props.receiver, this.props.messageID);
            var p2 = db.getMessage(this.props.messageID);
            Promise.all([p1, p2])
                   .then((results) => {
                       var msgs = [results[1]].concat(results[0]);
                       for (var i in msgs) {
                           var m = msgs[i];
                           m.receiver = m.group_id;
                           this.parseMessageContent(m);
                           this.downloadAudio(m);
                       }
                       console.log("set messages:", msgs.length);
                       this.props.dispatch(setMessages(msgs));
                   });
            
            this.state.canLoadNewContent = true;
            
        } else {
            db.getMessages(this.props.receiver)
              .then((msgs) => {
                  for (var i in msgs) {
                      var m = msgs[i];
                      m.receiver = m.group_id;
                      this.parseMessageContent(m);
                      this.downloadAudio(m);
                  }
                  console.log("set messages:", msgs.length);
                  this.props.dispatch(setMessages(msgs));
              });
            this.state.canLoadNewContent = false;
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        
        var im = IMService.instance;
        im.removeObserver(this);

        this.listener.remove();
        this.ackListener.remove();
        this.failListener.remove();
    }

    parseMessageContent(m) {
        var obj = JSON.parse(m.content);
        var t = new Date();
        t.setTime(m.timestamp*1000);

        m._id = m.id;

        console.log("obj:", obj);
        if (obj.text) {
            m.text = obj.text;
        } else if (obj.image2) {
            if (obj.image2.fileName) {
                if (Platform.OS === 'ios') {
                    var uri = AudioUtils.DocumentDirectoryPath + "/images/" + obj.image2.fileName;
                    obj.image2.url = uri;
                    console.log("image uri:", uri);
                }
            }
            m.image = obj.image2
        } else if (obj.audio) {
            console.log("auido message....");
            m.audio = obj.audio;
        } else if (obj.location) {
            m.location = obj.location;
        } else if (obj.notification) {
            m.notification = obj.notification;
        }
        
        m.uuid = obj.uuid;
        m.createdAt = t;
        m.user = {
            _id:m.sender
        };
        m.outgoing = (this.sender == m.sender);
    }

    addMessage(message) {
        this.props.dispatch(addMessage(message));
        this.scrollToBottom();
    }
    
    saveMessage(message) {
        var db = GroupMessageDB.getInstance();
        return db.insertMessage(message);
    }

    updateMessageAttachment(msgID, attachment) {
        var db = GroupMessageDB.getInstance();
        db.updateAttachment(msgID, attachment);
    }

    setMessageListened(message) {
        var f = message.flags | MESSAGE_FLAG_LISTENED;
        var db = GroupMessageDB.getInstance();
        db.updateFlags(message.id, f);
    }

    setMessageFailure(message) {
        var f = message.flags | MESSAGE_FLAG_FAILURE;
        var db = GroupMessageDB.getInstance();
        db.updateFlags(message.id, f);
    }
    
    sendMessage(message) {
        var im = IMService.instance;
        return im.sendGroupMessage(message);
    }

    _loadMoreContentAsync = async () => {
        if (this.props.messages.length == 0) {
            return;
        }
        var m = this.props.messages[this.props.messages.length - 1];

        console.log("load more content...:", m.id);

        var db = GroupMessageDB.getInstance();
        var p = db.getEarlierMessages(this.props.receiver, m.id);

        messages = await p;

        if (messages.length == 0) {
            this.setState({
                canLoadMoreContent:false
            })
            return;
        }
        for (var i in messages) {
            var m = messages[i];
            this.parseMessageContent(m);
            this.downloadAudio(m);
        }

        this.props.dispatch(insertMessages(messages));
        return;
    }

    _loadNewContentAsync = async () => {
        if (this.props.messages.length == 0) {
            return;
        }

        var m = this.props.messages[0];

        console.log("load more content...:", m.id);
      
        var db = GroupMessageDB.getInstance();
        var p = db.getLaterMessages(this.props.receiver, m.id);

        messages = await p;

        if (messages.length == 0) {
            this.setState({
                canLoadNewContent:false
            })
            return;
        }
        for (var i in messages) {
            var m = messages[i];
            this.parseMessageContent(m);
            this.downloadAudio(m);
        }

        this.props.dispatch(addMessages(messages));
        return;
    }
}


var GroupChat = connect(function(state){
    return {messages:state.messages};
})(BaseGroupChat);

export default GroupChat;
