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
    DeviceEventEmitter,
} from 'react-native';
import {connect} from 'react-redux'
var SearchBar = require('react-native-search-bar');
import { NativeModules } from 'react-native';

const screen = Dimensions.get('window');
const WIDTH = screen.width;
const HEIGHT = screen.height;

import ProfileDB from "./model/ProfileDB";
import {SDK_API_URL} from './config';
import BaseConversation from './BaseConversation';

class Conversation extends BaseConversation {
    static navigatorButtons = {
        rightButtons: [
            {
                title: '+', 
                id: 'new', 
                showAsAction: 'ifRoom' 
            },
            {
                icon: require('./Images/search.png'),
                id:'search',
                showAsAction: 'always',
            }
        ]
    };

    
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([]),
        };
    }
   

    onNavigatorEvent(event) {
        super.onNavigatorEvent(event);
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'search') {
                console.log("search");
                this.search();
            }
        }
    }

    componentWillMount() {
        super.componentWillMount();

        var self = this;
        var xiaomi = NativeModules.XiaoMi;
        this.xmListener = DeviceEventEmitter.addListener('xiaomi_device_token',
                                                         function(e: Event) {
                                                             console.log("xiaomi event:", e);
                                                             var deviceToken = e.device_token;
                                                             self.bindDeviceToken(deviceToken);
                                                             

        });
        xiaomi.register();
    }

    componetWillUnmount() {
        super.componetWillUnmount();
        this.xmListener.remove();
    }

    bindDeviceToken(deviceToken) {
        //bind device token
        var profile = ProfileDB.getInstance();
        var token = profile.gobelieveToken
        var url = SDK_API_URL + "/device/bind";
        var obj = {"xm_device_token":deviceToken};
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token,
            },
            body:JSON.stringify(obj),
        }).then((response) => {
            console.log("bind xiaomi device token status:", response.status);
        }).catch((error) => {
            console.log("bind xiaomi device token error:", error);
        });
    }
    
    search() {
        var navigator = this.props.navigator;
        navigator.push({
            title:"Search",
            screen:"app.Search",
            navigatorStyle:{
                tabBarHidden:true
            },
            passProps:{
                contacts:this.contacts,
                groups:this.groups,
            },
        });
    }

    render() {
        return (
            <View style={{flex:1}}>
                <ListView
                    ref = {(r) => {this.listView = r}}
                    onScroll={this.onScroll.bind(this)}
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );
    }
    
}

Conversation = connect(function(state){
    return {
        conversations:state.conversations,
    };
})(Conversation);

export default Conversation;
