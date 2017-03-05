import React from 'react';
import {
    Platform,
} from 'react-native';

import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import {AudioUtils} from 'react-native-audio';

import PeerMessageDB from './PeerMessageDB.js'
import {setMessages, addMessage, addMessages, insertMessages, ackMessage} from './actions'
import {MESSAGE_FLAG_FAILURE, MESSAGE_FLAG_LISTENED} from './IMessage';

var IMService = require("./im");

import Chat from './Chat';

export class BasePeerChat extends Chat {
    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);
        this.readonly = false;
    }

    onPeerMessage(message) {
        if ((message.sender == this.props.peer ||
             message.receiver == this.props.peer) &&
            !this.readonly){
            this.downloadAudio(message);
            this.props.dispatch(addMessage(message));
            this.scrollToBottom();
        }        
    }

    onPeerMessageAck(message) {
        if ((message.sender == this.props.peer ||
             message.receiver == this.props.peer) &&
            !this.readonly) {
            this.props.dispatch(ackMessage(message.id));
        }
    }
    
    componentWillMount() {
        super.componentWillMount();
        
        var im = IMService.instance;
        im.addObserver(this);

        console.log("on aaaaa:", this.onPeerMessageAck);

        var f2 = (m) => {
            this.onPeerMessageAck(m);
        }

        var f1 = (m) => {
            this.onPeerMessage(m);
        }
        this.listener = RCTDeviceEventEmitter.addListener('peer_message', f1)
        this.ackListener = RCTDeviceEventEmitter.addListener('peer_message_ack', f2);

        this.readonly = this.props.messageID ? true : false;
        var db = PeerMessageDB.getInstance();

        if (this.props.messageID) {
            //从搜索页面跳转来, 查看某一条消息
            var p1 = db.getEarlierMessages(this.props.receiver, this.props.messageID, 2);
            var p2 = db.getMessage(this.props.messageID);
            var p3 = db.getLaterMessages(this.props.receiver, this.props.messageID);
            Promise.all([p1, p2, p3])
                   .then((results) => {
                       var msgs = results[2].concat(results[1], results[0]);
                       for (var i in msgs) {
                           var m = msgs[i];
                           m.receiver = m.group_id;
                           this.parseMessageContent(m);
                           this.downloadAudio(m);
                       }
                       console.log("set messages:", msgs.length);
                       this.props.dispatch(setMessages(msgs));
                       setTimeout(() => {
                           this.scrollToTop(false);
                       }, 0);
                   });
            this.state.canLoadNewContent = true;
        } else {
            db.getMessages(this.props.receiver)
            .then((msgs)=>{
                for (var i in msgs) {
                    var m = msgs[i];
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
    }

    parseMessageContent(m) {
        var obj = JSON.parse(m.content);
        var t = new Date();
        t.setTime(m.timestamp*1000);
        
        if (m.attachment) {
            console.log("attachment:", m.attachment);
        }
        
        m._id = m.id;
        m.outgoing = (m.sender == this.props.sender);
        
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
            m.image = obj.image2;
            if (m.attachment) {
                m.image.url = m.attachment;
            }
        } else if (obj.audio) {
            console.log("auido message....");
            m.audio = obj.audio;
        } else if (obj.location) {
            m.location = obj.location;
        }
        m.uuid = obj.uuid;
        
        m.createdAt = t;
        m.user = {
            _id:m.sender
        };
    }

    addMessage(message) {
        this.props.dispatch(addMessage(message));
        this.scrollToBottom();
    }
    
    saveMessage(message) {
        var db = PeerMessageDB.getInstance();
        if (this.readonly) {
            return db.getMessages(this.props.peer)
                     .then((msgs) => {
                         for (var i in msgs) {
                             var m = msgs[i];
                             this.parseMessageContent(m);
                             this.downloadAudio(m);
                         }
                         console.log("set messages:", msgs.length);
                         this.props.dispatch(setMessages(msgs));
                         this.readonly = false;
                     })
                     .then(() => {
                         message.peer = this.props.peer;
                         return db.insertMessage(message, this.props.peer);
                     })
                     .then((msgid) => {
                         console.log("new peer message id:", msgid);
                         return msgid;
                     });
        } else {
            message.peer = this.props.peer;
            return db.insertMessage(message, this.props.peer);
        }
    }

    updateMessageAttachment(msgID, attachment) {
        var db = PeerMessageDB.getInstance();
        db.updateAttachment(msgID, attachment);
    }

    setMessageListened(message) {
        var f = message.flags | MESSAGE_FLAG_LISTENED;
        var db = PeerMessageDB.getInstance();
        db.updateFlags(message.id, f);
    }

    sendMessage(message) {
        var im = IMService.instance;
        if (im.connectState == IMService.STATE_CONNECTED) {
            im.sendPeerMessage(message);
        }
    }

    _loadMoreContentAsync = async () => {
        if (this.props.messages.length == 0) {
            return;
        }
        var m = this.props.messages[this.props.messages.length - 1];

        console.log("load more content...:", m.id);

        var db = PeerMessageDB.getInstance();
        var p = db.getEarlierMessages(this.props.receiver, m.id)

        var messages = await p;

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

        console.log("load new content...:", m.id, this.props.receiver);
 
        var db = PeerMessageDB.getInstance();
        var p = db.getLaterMessages(this.props.receiver, m.id)
                  .then((msgs) => {
                      console.log("mmmm:", msgs);
                      return msgs;
                  });
        var messages = await p;
        console.log("load new content...:", messages);
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


PeerChat = connect(function(state){
    return {messages:state.messages};
})(BasePeerChat);

export default PeerChat;
