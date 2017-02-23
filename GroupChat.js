import BaseGroupChat from "./chat/GroupChat.js"
import {connect} from 'react-redux'

import GroupDB from './group/GroupDB'

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
}



GroupChat = connect(function(state){
    return {messages:state.messages};
})(GroupChat);

export default GroupChat;
