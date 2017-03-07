/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    TextInput,
    Image,
    ScrollView,
    Navigator,
    TouchableHighlight,
    ActionSheetIOS,
    NetInfo,
    AppState,
    View,
    Platform,
    AsyncStorage,
    NativeModules,
    NativeAppEventEmitter,
} from 'react-native';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter'
import {Navigation} from 'react-native-navigation';
var SQLite = require('react-native-sqlite-storage');
SQLite.enablePromise(false);

import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';

import ProfileDB from './model/ProfileDB';
import GroupDB from './group/GroupDB';
import ContactDB from './model/ContactDB';
import SyncKeyDB from './model/SyncKeyDB';

import Authentication from "./Authentication";
import Login from "./Login";
import Conversation from './Conversation';
import Contact from './Contact';
import Department from './Department';
import SearchResult from './SearchResult';
import Search from './Search';

import LocationPicker from './chat/LocationPicker';
import Photo from './chat/Photo';
import PeerChat from "./PeerChat";
import GroupChat from "./GroupChat";

import {GroupCreator, GroupSelectMember} from "./group/group_creator";
import GroupSetting from './group/group_setting';
import GroupName from './group/group_name';
import GroupMemberAdd from './group/group_member_add';
import GroupMemberRemove from './group/group_member_remove';


import {messagesReducer}  from './chat/reducers';
import {conversationsReducer,conversationReducer, profileReducer} from './reducers';
import {groupReducer} from './group/actions';

var IMService = require("./chat/im");
var im = IMService.instance;


//do not use combineReducers which ignore init state of createStore
function appReducer(state={}, action) {
    return {
        conversations:conversationsReducer(state.conversations, action),
        messages:messagesReducer(state.messages, action),
        conversation:conversationReducer(state.conversation, action),
        profile:profileReducer(state.profile, action),
        group:groupReducer(state.group, action),
    };
}




var app = {
    registerScreens: function() {
        Navigation.registerComponent('app.Authentication', () => Authentication, this.store, Provider);
        Navigation.registerComponent('app.Login', () => Login, this.store, Provider);
        Navigation.registerComponent('app.Conversation', () => Conversation, this.store, Provider);
        Navigation.registerComponent('app.Contact', () => Contact, this.store, Provider);
        Navigation.registerComponent('app.Department', () => Department, this.store, Provider);
        Navigation.registerComponent('app.SearchResult', () => SearchResult, this.store, Provider);
        Navigation.registerComponent('app.Search', () => Search, this.store, Provider);
        
        Navigation.registerComponent('chat.PeerChat', () => PeerChat, this.store, Provider);
        Navigation.registerComponent('chat.GroupChat', () => GroupChat, this.store, Provider);
        Navigation.registerComponent('chat.Photo', () => Photo, this.store, Provider);
        Navigation.registerComponent('chat.LocationPicker', () => LocationPicker, this.store, Provider);

        Navigation.registerComponent('group.GroupSelectMember', () => GroupSelectMember, this.store, Provider);
        Navigation.registerComponent('group.GroupCreator', () => GroupCreator, this.store, Provider);
        Navigation.registerComponent('group.GroupSetting', () => GroupSetting, this.store, Provider);
        Navigation.registerComponent('group.GroupName', () => GroupName, this.store, Provider);
        Navigation.registerComponent('group.GroupMemberAdd', () => GroupMemberAdd, this.store, Provider);
        Navigation.registerComponent('group.GroupMemberRemove', () => GroupMemberRemove, this.store, Provider);
    },
    

    handleConnectivityChange: function(reach) {
        console.log('connectivity change: ' + reach);
    },

    handleAppStateChange: function(currentAppState) {
        console.log("app state:", currentAppState);
        if (currentAppState == "background") {
            if (this.uid > 0 && Platform.OS == 'ios') {
                var state = this.store.getState();
                var newCount = 0;
                state.conversations.forEach((conv) => {
                    newCount += conv.unread;
                });
                console.log("send unread count:", newCount);
                im.sendUnreadCount(newCount);
            }
            im.enterBackground();
        } else if (currentAppState == "active") {
            im.enterForeground();
        }
    },

    runApp: function(profile) {
        this.store.dispatch({type:"set_profile", profile:profile});
        this.uid = profile.uid;

        var dbName = `contact_${profile.uid}.db`;
        var options = {
            name:dbName,
            createFromLocation : "~www/contact.db"
        };
        var db = SQLite.openDatabase(options,
                                     function() {
                                         console.log("db open success");
                                     },
                                     function(err) {
                                         console.log("db open error:", err);
                                     });
        ContactDB.getInstance().setDB(db);
        GroupDB.getInstance().setDB(db);
        SyncKeyDB.getInstance().setDB(db);


        dbName = `gobelieve_${profile.uid}.db`;
        options = {
            name:dbName,
            createFromLocation : "~www/gobelieve.db"
        };
        db = SQLite.openDatabase(options,
                                 function() {
                                     console.log("db open success");
                                 },
                                 function(err) {
                                     console.log("db open error:", err);
                                 });
        PeerMessageDB.getInstance().setDB(db);
        GroupMessageDB.getInstance().setDB(db);
        
        
        Navigation.startTabBasedApp({
            tabs: [
                {
                    screen: 'app.Conversation',
                    icon: require("./Images/tabbar_chats.png"),
                    label:"对话",
                    title:"对话",
                    navigatorStyle: {
                        navBarBackgroundColor: '#4dbce9',
                        navBarTextColor: '#ffff00',
                        navBarSubtitleTextColor: '#ff0000',
                        navBarButtonColor: '#ffffff',
                        statusBarTextColorScheme: 'light'
                    },
                },
                {
                    screen: 'app.Contact',
                    icon: require("./Images/tabbar_contacts.png"),
                    label:"联系人",
                    title:"联系人",
                    navigatorStyle: {
                        navBarBackgroundColor: '#4dbce9',
                        navBarTextColor: '#ffff00',
                        navBarSubtitleTextColor: '#ff0000',
                        navBarButtonColor: '#ffffff',
                        statusBarTextColorScheme: 'light'
                    },
                }
            ],
            passProps: {
                app:this
            }
        });
    },
    
    startApp: function() {
        this.store = createStore(appReducer);
        if (Platform.OS == 'ios') {
            AppState.addEventListener('change', this.handleAppStateChange.bind(this));
        } else {
            //android 会打开多个activity(地图)
            var self = this;
            RCTDeviceEventEmitter.addListener('app_state', function(event) {
                self.handleAppStateChange(event.state);
            });
        }
        
        var im = IMService.instance;
        im.startReachabilityNotifier();

        this.registerScreens();



        ProfileDB.getInstance().load((e, o) => {
            console.log("profile:", e, o);
            if (e || o.uid == 0) {
                Navigation.startSingleScreenApp({
                    screen: {
                        screen: 'app.Authentication',
                        title: '手机验证',
                        navigatorStyle: {
                            navBarBackgroundColor: '#4dbce9',
                            navBarTextColor: '#ffff00',
                            navBarSubtitleTextColor: '#ff0000',
                            navBarButtonColor: '#ffffff',
                            statusBarTextColorScheme: 'light'
                        },
                    },
                    passProps: {
                        app:this
                    }
                });
            } else {
                this.runApp(o);
            }
        });
    },
}

app.startApp();
