import {Platform} from 'react-native';
import {BaseGroupChat} from "./chat/GroupChat.js"
import {connect} from 'react-redux'

import GroupDB from './group/GroupDB'
import ConversationDB from './model/ConversationDB'

import {setUnread, updateConversation} from './actions'
import {setConversation} from './actions';
import { NativeModules } from 'react-native';

class GroupChat extends BaseGroupChat {
    static navigatorButtons = {
        rightButtons: [
            {
                title: '设置', 
                id: 'setting', 
                showAsAction: 'ifRoom' 
            },
        ]
    };

    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    handleSetting() {
        console.log("setting...");
        var groupID = this.props.receiver;
        var db = GroupDB.getInstance();
        db.getGroup(groupID)
          .then((group) => {
              console.log("group:", group);
              if (group.members) {
                  group.members = group.members.map((m) => {
                      var c = this.props.contacts.find((c) => {
                          return c.id == m.uid;
                      });
                      if (c) {
                          m.name = c.name;
                      }
                      return m;
                  });
              }
              this.props.dispatch({type:"set_group", group:group});
              this.props.navigator.push({
                  title:"setting",
                  screen:"group.GroupSetting",
                  navigatorStyle:{
                      tabBarHidden:true
                  },
                  passProps:{
                      contacts:this.props.contacts
                  },
              });
          });

    }
    onNavigatorEvent(event) {
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'setting') {
                this.handleSetting();
            }     
        }
    }


    componentWillUnmount() {
        super.componentWillUnmount();

        this.props.dispatch(setUnread("g_" + this.props.receiver, 0));
        this.props.dispatch(setConversation({}));

        ConversationDB.getInstance().setUnread("g_" + this.props.receiver, 0);
    }


    
    addMessage(message) {
        super.addMessage(message);
        var conv = {
            cid:"g_" + this.props.receiver,
            message:message,
            timestamp:message.timestamp,
            name:this.props.name,
        }
        
        var msgObj = JSON.parse(message.content);
        if (msgObj.text) {
            conv.content = msgObj.text;
        } else if (msgObj.image2) {
            conv.content = "一张图片";
        } else if (msgObj.audio) {
            conv.content = "语音"
        } else if (msgObj.location) {
            conv.content = "位置";
        } else if (msgObj.notification) {
            var notification = "";
            var n = JSON.parse(msgObj.notification);
            if (n.create) {
                if (n.create.master == this.props.sender) {
                    notification = `您创建了${n.create.name}群组`;
                } else {
                    notification = `您加入了${n.create.name}群组`;
                }
            } else if (n.add_member) {
                notification = `${n.add_member.name}加入群`;
            } else if (n.quit_group) {
                notification = `${n.quit_group.name}离开群`;
            } else if (n.disband) {
                notification = "群组已解散";
            }
            m.notification = notification;
        } else {
            conv.content = "";
        }
        this.props.dispatch(updateConversation(conv));
    }

    handleLocationClick() {
        if (Platform.OS == 'android') {
            var picker = NativeModules.LocationPicker;
            picker.pickLocation()
                  .then((coordinate) => {
                      console.log("coordinate:",
                                  coordinate.longitude,
                                  coordinate.latitude,
                                  coordinate.address);
                      this.sendLocationImage(coordinate.longitude,
                                             coordinate.latitude);
                  })
                  .catch((e) => {
                      console.log("location picker err:", e);
                  })
        } else {
            super.handleLocationClick();
        }
    }
}



GroupChat = connect(function(state){
    return {messages:state.messages};
})(GroupChat);

export default GroupChat;
