import React from 'react';
import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TouchableWithoutFeedback,
    TouchableHighlight
} from 'react-native';


import {connect} from 'react-redux'
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import Spinner from 'react-native-loading-spinner-overlay';
var SQLite = require('react-native-sqlite-storage');

import ProfileDB from "./ProfileDB";
const API_URL = "http://goubuli.mobi";

class Contact extends React.Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([
            ])
        };

        this.uid = 0;
    }

    syncContact() {
        var self = this;
        var navigator = this.props.navigator;
        var url = API_URL + "/contact/sync?key=0";
        
        var profile = ProfileDB.getInstance();
        var accessToken = profile.accessToken;

        var now = new Date();
        console.log("now:", now.getTime()/1000, profile.expires);
        console.log("access token:", accessToken);
        this.setState({
            spinnerVisible:true
        });
        fetch(url, {
            method:"GET",  
            headers: {
                'Accept': 'application/json',
                "Authorization": "Bearer " + accessToken
            },
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

                //todo save contact
                var contacts = responseJson.contacts;

                var arr = [];
                for (var i in contacts) {
                    var contact = contacts[i];
                    var name = contact['given_name'];
                    var id = parseInt(contact['id']);
                    arr.push({id:id, name:name});
                }

                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(arr)
                })
                return;
            } else {
                console.log("response json:", responseJson);
                if (responseJson.meta) {
                    alert(responseJson.meta.message);
                }
            }
        }).catch((error) => {
            console.log("error:", error);
            this.setState({
                spinnerVisible:false
            });
            alert(error);
        });
    }
    
    componentWillMount() {
        var profile = ProfileDB.getInstance();
        var now = new Date();
        now = now.getTime()/1000;
        if (now - 60 - profile.expires > 0) {
            console.log("token expires");
            
            var url = API_URL + "/auth/refresh_token";
            var obj = {
                refresh_token:profile.refreshToken
            };
            
            fetch(url, {
                method:"POST",  
                headers: {
                    'Accept': 'application/json',
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
                    var refreshToken = responseJson.refresh_token;
                    var accessToken = responseJson.access_token;
                    var expires = responseJson.expires_in;
                    var now = new Date();
                    now = now.getTime()/1000;
                    
                    profile.accessToken = accessToken;
                    profile.refreshToken = refreshToken;
                    profile.expires = now + expires;
                    profile.save(() => {
                    });
                    return;
                } else {
                    console.log("response json:", responseJson);
                    if (responseJson.error) {
                        alert(responseJson.error);
                    }
                }
            }).then(() => {
                this.syncContact();
            }).catch((error) => {
                console.log("error:", error);
                alert(error);
            });
        } else {
            this.syncContact();
        }
      
    }

    componetWillUnmount() {

    }
    
    componentWillReceiveProps(nextProps) {
        if (this.props.contacts === nextProps.contacts) {
            return;
        }
        this.setState({
            dataSource: this.state.dataSource.cloneWithRows(nextProps.contacts)
        });
    }
    
    renderRow(contact) {
        var navigator = this.props.navigator;
        var p = ProfileDB.getInstance();
        
        var self = this;
        function onPress() {
            console.log("row data:", contact);
            var profile = ProfileDB.getInstance();
            var token = profile.gobelieveToken;
            var uid = profile.uid;
            var peer = contact.id;
            navigator.push({
                title:"Chat",
                screen:"chat.PeerChat",
                navigatorStyle:{
                    tabBarHidden:true
                },
                passProps:{
                    sender:uid,
                    receiver:peer,
                    token:token
                },
            });
        }
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
                        <View style={{flex:1,
                                      marginLeft:12,
                                      flexDirection:"row"}}>
                            <Text style={{fontWeight:"bold"}}>
                                {contact.name}
                            </Text>
                            {
                                p.uid == contact.id ? (
                                    <Image style={{width:16,
                                                   height:16,
                                                   marginLeft:8}}
                                           source={require("./Images/star.png")}>
                                    </Image>
                                ) : null
                            }
                                   
                        </View>
                    </View>
                    
                    <View style={{ height:1, backgroundColor:"gray"}}/>
                </View>
            </TouchableHighlight>
        );
    }

    
    render() {
        return (
            <View style={{flex: 1, marginTop:4}}>
                <Spinner visible={this.state.spinnerVisible} />
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );        
    }

    
}

Contact = connect(function(state){
    return {
        conversations:state.contacts,
    };
})(Contact);

export default Contact;
