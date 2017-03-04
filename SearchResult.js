import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TouchableHighlight,
} from 'react-native';
import moment from 'moment/min/moment-with-locales.min';

import ProfileDB from './model/ProfileDB';

import {CONVERSATION_GROUP, CONVERSATION_PEER} from './IConversation';

export default class SearchResult extends React.Component {
    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows(this.props.conv.messages),
        };
    }

    renderRow(message) {
        var conv = this.props.conv;
        var self = this;
        var navigator = this.props.navigator;
        var profile = ProfileDB.getInstance();
        function onPress() {
            console.log("row data:", conv);
            if (conv.type == CONVERSATION_PEER) {
                navigator.push({
                    title:conv.name,
                    screen:"chat.PeerChat",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        sender:profile.uid,
                        receiver:conv.peer,
                        peer:conv.peer,
                        name:conv.name,
                        token:profile.gobelieveToken,
                        messageID:message.id,
                    },
                });
            } else if (conv.type == CONVERSATION_GROUP) {
                navigator.push({
                    title:conv.name,
                    screen:"chat.GroupChat",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        sender:profile.uid,
                        receiver:conv.groupID,
                        groupID:conv.groupID,
                        name:conv.name,
                        token:profile.gobelieveToken,
                        contacts:self.contacts,
                        messageID:message.id,
                    },
                });                
            }
        }

        //todo 搜索的关键字加色显示
        var t = new Date();
        t = t.setTime(message.timestamp*1000);
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
                                <Text style={{fontWeight:"100", fontSize:12, marginRight:8}}>
                                    {moment(t).locale('zh-cn').format('LT')}
                                </Text>
                            </View>
                            <Text>
                                {message.text}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }

    render() {
        return (
            <View style={{flex:1}}>
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );
    }
    
}
    
