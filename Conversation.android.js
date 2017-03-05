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
import {connect} from 'react-redux'
var SearchBar = require('react-native-search-bar');
const screen = Dimensions.get('window');
const WIDTH = screen.width;
const HEIGHT = screen.height;

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
