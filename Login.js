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
    View,
    AsyncStorage
} from 'react-native';

import { NativeModules, NativeAppEventEmitter } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {Navigation} from 'react-native-navigation';

import ProfileDB from './ProfileDB';

var IMService = require("./chat/im");
var im = IMService.instance;

const API_URL = "http://api.goubuli.mobi";
export default class Login extends Component {

    static navigatorButtons = {
        rightButtons: [
            {
                title: '确定',
                id: 'ok', 
            },
        ]
    };
    
    constructor(props) {
        super(props);
        var organizations = this.props.organizations;
        var orgs = organizations.map((org) => {
            org.checked = false;
            return org;
        })
        this.state = {
            organizations:orgs,
            spinnerVisible:false
        };
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }


    login() {
        var orgs = this.state.organizations;
        var org = orgs.find((org) => {
            return org.checked;
        });
        if (!org) {
            alert("请选择公司");
            return;
        }

        var self = this;
        var navigator = this.props.navigator;
        var url = API_URL + "/member/login_organization";
        var obj = {
            org_id:org.id
        };

        this.setState({
            spinnerVisible:true
        });
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.props.accessToken
            },
            body:JSON.stringify(obj)
        }).then((response) => {
            console.log("status:", response.status);
            return Promise.all([response.status, response.json()]);
        }).then((r) => {
            this.setState({
                spinnerVisible:false
            });
            var status = r[0];
            var responseJson = r[1];
            if (status == 200) {
                console.log("response json:", responseJson);
                var gobelieveToken = responseJson.gobelieve_token;
                var uid = responseJson.id;
                var username = responseJson.username;

                var profile = ProfileDB.getInstance();
                profile.accessToken = this.props.accessToken;
                profile.refreshToken = this.props.refreshToken;
                profile.expires = this.props.expires;
                profile.uid = uid;
                profile.name = username;
                profile.gobelieveToken = gobelieveToken;
                profile.save((e) => {
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
                                    app:this.props.app
                                }
                            });
                        });
                return;
            } else {
                console.log("error:", responseJson);
                alert(responseJson.error);
            }

        }).catch((error) => {
            console.log("error:", error);
            this.setState({
                spinnerVisible:false
            });
            alert(error);
        });
        
    }
    onNavigatorEvent(event) {
        console.log("navigation event:", event);
        if (event.type == 'NavBarButtonPress') { 
            if (event.id == 'ok') { 
                this.login();
            }
        }
    }


    componentDidMount() {
  
    }

    render() {
        var self = this;
        var renderOrg = function(org) {
            var f = function() {
                console.log("click org:", org.id, org.name);
                var checked = !org.checked;
                var orgs = self.state.organizations;
                var newOrgs = orgs.map((e) => {
                    if (e.id == org.id) {
                        //deep clone for rerender
                        e = Object.assign({}, e, {checked:checked});
                    } else {
                        e.checked = false;
                    }
                    return e;
                });
                self.setState({
                    organizations:newOrgs
                });
            }
            
            return (
                <TouchableHighlight underlayColor='ghostwhite'
                                    style={{flex:1, height:50}}
                                    key={org.id}
                                    onPress={f} >
                    <View style={{flex:1,
                                  flexDirection:"row",
                                  justifyContent:"space-between",
                                  alignItems:"center",
                                  marginLeft:8,
                                  marginRight:8,
                                  height:50}}>
                        <Text>
                            {org.name}
                        </Text>
                        <Image style={{width:20, height:20}}
                               source={org.checked ? require("./Images/check.png") : require("./Images/uncheck.png")}>
                        </Image>
                    </View>
                    
                </TouchableHighlight>
                
            )
        }
        var orgs = this.state.organizations;
        
        return (
            <View>
                <Spinner visible={this.state.spinnerVisible} />
                <ScrollView>
                    {orgs.map(renderOrg)}
                </ScrollView>
            </View>
        );
        
    }
}
