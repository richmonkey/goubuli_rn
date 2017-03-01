import React from 'react';
import {
    Platform,
} from 'react-native';

import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import {AudioUtils} from 'react-native-audio';

import PeerMessageDB from './PeerMessageDB.js'
import {setMessages, addMessage, insertMessages, ackMessage} from './actions'
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
    }

    componentWillMount() {
        super.componentWillMount();
        
        var im = IMService.instance;
        im.addObserver(this);

        this.listener = RCTDeviceEventEmitter.addListener('peer_message',
                                                          (message)=>{
                                                              if (message.sender == this.props.peer ||
                                                                  message.receiver == this.props.peer) {
                                                                  this.downloadAudio(message);
                                                                  this.props.dispatch(addMessage(message));
                                                                  this.scrollToBottom();
                                                              }
                                                          });


        this.ackListener = RCTDeviceEventEmitter.addListener('peer_message_ack',
                                                          (message)=>{
                                                              if (message.sender == this.props.peer ||
                                                                  message.receiver == this.props.peer) {
                                                                  this.props.dispatch(ackMessage(message.id));
                                                              }
                                                          });
        
        var db = PeerMessageDB.getInstance();

        db.getMessages(this.props.receiver,
                       (msgs)=>{
                           for (var i in msgs) {
                               var m = msgs[i];
                               this.parseMessageContent(m);
                               this.downloadAudio(m);
                           }
                           console.log("set messages:", msgs.length);
                           this.props.dispatch(setMessages(msgs));
                       },
                       (e)=>{});

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
        var p = new Promise((resolve, reject) => {
            db.insertMessage(message, this.props.receiver,
                             function(rowid) {
                                 console.log("row id:", rowid);
                                 resolve(rowid);
                             },
                             function(err) {
                                 reject(err);
                             });
            
        });
        return p;
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
        var p = new Promise((resolve, reject) => {
            var db = PeerMessageDB.getInstance();
            db.getEarlierMessages(this.props.receiver, m.id,
                                  (messages) => {
                                      resolve(messages);
                                  },
                                  (err) => {
                                      reject(err);
                                  });
        });

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
}


PeerChat = connect(function(state){
    return {messages:state.messages};
})(BasePeerChat);

export default PeerChat;
