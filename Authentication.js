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
    Platform,
    Keyboard,
    AsyncStorage
} from 'react-native';

import { NativeModules, NativeAppEventEmitter } from 'react-native';

import ProgressHUD from './ProgressHUD';

var IMService = require("./chat/im");
var im = IMService.instance;

const API_URL = "http://api.goubuli.mobi";
export default class Authentication extends Component {
    constructor(props) {
        super(props);
        this.state = {
            number:"",
            code:"",
            receivingSMS:false,//正在接受短信
            tick:0,//获取短信验证码计时
        };
    }
    
    componentDidMount() {
        
    }

    
    componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    handleLogin() {
        console.log("login:", this.state);

        if (this.state.number.length == 0) {
            alert("请填写手机号码");
            return;
        }
        if (this.state.code.length == 0) {
            alert("请填写验证码");
            return;
        }
        if (this.number != this.state.number) {
            alert("验证码和手机号码不匹配");
            return;
        }
        this.login();
    }

    login() {
        var self = this;
        var navigator = this.props.navigator;
        var url = API_URL + "/auth/token";
        var obj = {
            code:this.state.code,
            zone:'86',
            number:this.state.number,
        };

        ProgressHUD.show();
        
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(obj)
        }).then((response) => {
            console.log("status:", response.status);
            return Promise.all([response.status, response.json()]);
        }).then((r) => {
            var status = r[0];
            var responseJson = r[1];
            if (status == 200) {
                console.log("response json:", responseJson);

                var accessToken = responseJson.access_token;
                var refreshToken = responseJson.refresh_token;
                var expires = responseJson.expires_in;
                var orgs = responseJson.organizations;

                var t = new Date();
                var exp = t.getTime()/1000 + expires;

                navigator.push({
                    title:"登录",
                    screen:"app.Login",
                    passProps:{
                        organizations:orgs,
                        accessToken:accessToken,
                        refreshToken:refreshToken,
                        expires:exp,
                        app:this.props.app
                    },
                });
            } else {
                console.log(responseJson.meta.message);
                return Promise.reject(responseJson.meta.message);
            }

        }).then(() => {
            ProgressHUD.dismiss();
        }).catch((error) => {
            console.log("error:", error);
            ProgressHUD.dismiss();
            alert(error);
        });
    }


    onGetVerifyCode() {
        if (this.state.number.length == 0) {
            alert("请填写手机号码");
            return;
        }
        if (this.state.receivingSMS) {
            return;
        }

        Keyboard.dismiss();
        
        var url = API_URL + `/verify_code?zone=86&number=${this.state.number}`;
        console.log("url:", url);

        ProgressHUD.show();
        fetch(url, {
            method:"POST",  
            headers: {
                'Accept': 'application/json',
            },
        }).then((response) => {
            console.log("status:", response.status);
            return Promise.all([response.status, response.json()]);
        }).then((r) => {
            var status = r[0];
            var responseJson = r[1];
            if (status == 200) {
                console.log("response json:", responseJson);
                var code = responseJson.code;
                console.log("code:", code, "number:", this.state.number);
                this.number = this.state.number;

                this.setState({receivingSMS:true, tick:0});

                this.timer = setInterval(() => {
                    var t = this.state.tick + 1;
                    this.setState({
                        tick:t
                    });

                    if (t > 60) {
                        clearInterval(this.timer);
                        this.timer = undefined;
                        this.setState({receivingSMS:false, tick:0});
                    }
                }, 1000);
            } else {
                console.log(responseJson.meta.message);
            }
        }).then(() => {
            ProgressHUD.dismiss();
        }).catch((error) => {
            console.log("error:", error);
            ProgressHUD.dismiss();
        });
    }
    
    render() {
        var text = "获取验证码";
        if (this.state.receivingSMS) {
            var t = Math.max(0, 60 - this.state.tick);
            text = `${t}后重试`;
        }

        var inputHeight = Platform.select({
            ios:35,
            android:45
        });

        return (
            <View style={{flex:1, marginHorizontal:16}}>
                <TextInput
                    onChangeText={(text) => {
                            this.setState({number:text});
                        }}
                    style={{    
                        marginTop:40,
                        marginHorizontal:8,
                        borderRadius:4,
                        borderWidth: 1,
                        borderColor: 'gray',
                        height:inputHeight,
                        padding:4,
                    }}
                    underlineColorAndroid='rgba(0,0,0,0)'
                    keyboardType="numeric"
                    placeholder="手机号码"
                    value={this.state.number}
                />

                <View style={{flexDirection:"row", height:inputHeight,
                              alignItems: 'center', alignSelf:'center', marginTop:30}}>
                    <TextInput
                        onChangeText={(text) => {
                                this.setState({code:text});
                            }}
                        style={{
                            marginHorizontal:8,
                            borderRadius:4,
                            borderWidth: 1,
                            borderColor: 'gray',
                            height:inputHeight,
                            flex:1,
                            padding:4,
                        }}
                        underlineColorAndroid='rgba(0,0,0,0)'
                        keyboardType="numeric"
                        placeholder="验证码"
                        value={this.state.code}
                    />

                    <TouchableHighlight underlayColor='ghostwhite'
                                        style={{}}
                                        onPress={this.onGetVerifyCode.bind(this)} >
                        <Text style={{padding:8}}>{text}</Text>
                    </TouchableHighlight>
                </View>

                <View   style={{flexDirection: 'row'}}>
                <TouchableHighlight underlayColor='ghostwhite'
                                    style={{alignItems: 'center',
                                            alignSelf:'center',
                                            justifyContent:'center',
                                            marginTop:24,
                                            marginRight:8,
                                            marginHorizontal:8,
                                            flex:1.0,
                                            height:40,
                                            backgroundColor:"gainsboro"}}
                                    onPress={this.handleLogin.bind(this)} >
                    <Text style={{}}>
                        登录
                    </Text>
                </TouchableHighlight>
                </View>
            </View>
        );
        
    }
}
