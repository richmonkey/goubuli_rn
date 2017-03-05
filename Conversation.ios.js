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
import Searchable from './Searchable';

class Conversation extends BaseConversation {
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

        this._onRegistered = this._onRegistered.bind(this);
        this._onRegistrationError = this._onRegistrationError.bind(this);

        
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([]),
            searchDataSource:ds.cloneWithRows([]),
            showSearchCancel:false,
            searchText:"",
        };
        this.searchBarHeight = 44;
    }
    bindDeviceToken(deviceToken) {
        //bind device token
        var profile = ProfileDB.getInstance();
        var token = profile.gobelieveToken
        var url = SDK_API_URL + "/device/bind";
        var obj = {"apns_device_token":deviceToken};
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token,
            },
            body:JSON.stringify(obj),
        }).then((response) => {
            console.log("bind apns device token status:", response.status);
        }).catch((error) => {
            console.log("bind apns device token error:", error);
        });
    }

    _onRegistered(r) {
        console.log("apns device token:", r);
        var deviceToken = r;
        this.bindDeviceToken(deviceToken);
    }

    _onRegistrationError(e) {
        console.log("register error:", e);
    }

    componentWillMount() {
        super.componentWillMount();
        PushNotificationIOS.addEventListener('register', this._onRegistered);
        PushNotificationIOS.addEventListener('registrationError', this._onRegistrationError);
        PushNotificationIOS.requestPermissions();
    }

    componetWillUnmount() {
        super.componetWillUnmount();
        PushNotificationIOS.removeEventListener('register', this._onRegistered);
        PushNotificationIOS.removeEventListener('registrationError', this._onRegistrationError);
    }

    setApplicationIconBadgeNumber(badge) {
        super.setApplicationIconBadgeNumber(badge);
        PushNotificationIOS.setApplicationIconBadgeNumber(badge);
    }

    //search function
    onFocus() {
        console.log("on focus");
        this.setState({showSearchCancel:true});
        var navigator = this.props.navigator;
        navigator.toggleNavBar({
            to:'hidden',
            animated:true
        });
    }
    
    onBlur() {
        console.log("on blur");
        this.setState({showSearchCancel:false});
        var navigator = this.props.navigator;
        navigator.toggleNavBar({
            to:'shown',
            animated:true
        });
    }


    renderSearchBar() {
        return (
            <SearchBar
                ref = {(r) => {this.searchBar = r}}
                placeholder='Search'
                text = {this.state.searchText}
                showsCancelButton={this.state.showSearchCancel}
                onFocus={this.onFocus.bind(this)}
                onBlur={this.onBlur.bind(this)}
                onChangeText={this.onSearchBarChangeText.bind(this)}
                onSearchButtonPress={() => {console.log("search button press");}}
                onCancelButtonPress={() => {console.log("search cancel");}}
            />
        );
    }

    cancelSearch() {
        this.setState({
            searchText:"",
            showSearchCancel:false,
            searchDataSource:this.state.searchDataSource.cloneWithRows([])
        });
        this.searchBar.blur();
        var navigator = this.props.navigator;
        navigator.toggleNavBar({
            to:'shown',
            animated:false,
        });
    }
    
    render() {
        var marginTop = this.state.showSearchCancel ? 22 : 0;
        var left = this.state.showSearchCancel ? 0: WIDTH;
        var backgroundColor = (this.state.searchText.length) ? "white" : "#a9a9a97f";

        var self = this;
        var onResponderRelease = function() {
            console.log("on release:", self.refs);
            if (self.state.searchText.length > 0) {
                return;
            }
            self.searchBar.blur();
        }

        return (
            <View style={{flex:1, marginTop:marginTop}}>
                <ListView
                    ref = {(r) => {this.listView = r}}
                    onScroll={this.onScroll.bind(this)}
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderHeader={this.renderSearchBar.bind(this)}
                    renderRow={this.renderRow.bind(this)}
                />
                
                <View
                    style={{flex:1,
                            right:0,
                            left:left,
                            bottom:0,
                            top:0,
                            position:"absolute",
                            marginTop:44,
                            backgroundColor:backgroundColor,
                            zIndex:10}}
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={onResponderRelease}>
                    <ListView
                        style={{flex:1}}
                        enableEmptySections={true}
                        dataSource={this.state.searchDataSource}
                        renderRow={(r) => this.renderSearchRow(r)}
                    />
                </View>
            </View>
        );
    }
    
}

Object.assign(Conversation.prototype, Searchable);

Conversation = connect(function(state){
    return {
        conversations:state.conversations,
    };
})(Conversation);

export default Conversation;
