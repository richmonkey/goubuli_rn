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

var IMService = require("./chat/im");
var im = IMService.instance;

const API_URL = "http://goubuli.mobi";
export default class Authentication extends Component {
    constructor(props) {
        super(props);
        this.state = {
            number:"",
            code:"",
            spinnerVisible:false
        };
    }
    
    componentDidMount() {
        
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

        this.setState({
            spinnerVisible:true
        });
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
            this.setState({
                spinnerVisible:false
            });
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
                    title:"Login",
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
                alert(responseJson.meta.message);
            }

        }).catch((error) => {
            console.log("error:", error);
            this.setState({
                spinnerVisible:false
            });
            alert(error);
        });
    }


    onGetVerifyCode() {
        if (this.state.number.length == 0) {
            alert("请填写手机号码");
            return;
        }
        var url = API_URL + `/auth/verify_code?zone=86&number=${this.state.number}`;
        console.log("url:", url);

        this.setState({
            spinnerVisible:true
        });
        
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

            this.setState({
                spinnerVisible:false
            });
            if (status == 200) {
                console.log("response json:", responseJson);
                var code = responseJson.code;
                console.log("code:", code, "number:", this.state.number);
                this.number = this.state.number;
            } else {
                console.log(responseJson.meta.message);
            }
        }).catch((error) => {
            console.log("error:", error);
            this.setState({
                spinnerVisible:false
            });
        });
    }
    
    render() {
        return (
            <View>
                <Spinner visible={this.state.spinnerVisible} />
                <TextInput
                    onChangeText={(text) => {
                            this.setState({number:text});
                        }}
                    style={{    
                        marginTop:44,
                        marginLeft:8,
                        marginRight:8,
                        borderWidth: 0.5,
                        borderColor: '#0f0f0f',
                        height:35,
                    }}
                    keyboardType="numeric"
                    placeholder="手机号码"
                    value={this.state.number}
                />

                <TouchableHighlight underlayColor='ghostwhite'
                                    style={{width:100, alignItems: 'center', alignSelf:'center', marginTop:12}}
                                    onPress={this.onGetVerifyCode.bind(this)} >
                    <Text style={{padding:8}}>获取验证码</Text>
                </TouchableHighlight>

                <TextInput
                    onChangeText={(text) => {
                            this.setState({code:text});
                        }}
                    style={{    
                        marginTop:44,
                        marginLeft:8,
                        marginRight:8,
                        borderWidth: 0.5,
                        borderColor: '#0f0f0f',
                        height:35,
                    }}
                    keyboardType="numeric"
                    placeholder="验证码"
                    value={this.state.code}
                />

                <TouchableHighlight underlayColor='ghostwhite'
                                    style={{width:100,
                                            alignItems: 'center',
                                            alignSelf:'center',
                                            marginTop:12}}
                                    onPress={this.handleLogin.bind(this)} >
                    <Text style={{padding:8}}>登录</Text>
                </TouchableHighlight>
            </View>
        );
        
    }
}
