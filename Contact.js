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

import ProfileDB from "./model/ProfileDB";
import ContactDB from "./model/ContactDB";
import {API_URL} from "./config";

class Contact extends React.Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([
            ])
        };

        this.uid = 0;
        this.contacts = [];
    }

    syncContact(syncKey) {
        var self = this;
        var navigator = this.props.navigator;
        var url = API_URL + "/contact/sync?sync_key=" + syncKey;
        var profile = ProfileDB.getInstance();
        var accessToken = profile.accessToken;

        var now = new Date();
        console.log("now:", now.getTime()/1000, profile.expires);
        console.log("access token:", accessToken);
        console.log("sync key:", syncKey);
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

                var db = ContactDB.getInstance();
                var contacts = responseJson.contacts;

                var deletedContacts = [];
                var updatedContacts = [];
                for (var i in contacts) {
                    var contact = contacts[i];
                    if (contact['deleted']) {
                        deletedContacts.push(contact);
                        continue;
                    }
                    updatedContacts.push(contact);
                }

                var deletedDepartments = [];
                var updatedDepartments = [];
                var departments = responseJson.departments;
                for (var i in departments) {
                    var dept = departments[i];
                    if (dept['deleted']) {
                        deletedDepartments.push(dept);
                        continue;
                    }
                    updatedDepartments.push(dept);
                }
                
                db.updateDepartments(updatedDepartments)
                  .then(() => {
                      db.deleteDepartments(deletedDepartments);
                  })
                  .then(() => {
                      db.updateContacts(updatedContacts);
                  })
                  .then(() => {
                      db.deleteContacts(deletedContacts);
                  })
                  .then(() => {
                      db.updateSyncKey(responseJson.sync_key);                      
                  })
                  .then(() => {
                      return db.getDepartments();
                  })
                  .then((depts) => {
                      self.departments = depts;
                  })
                  .then(() => {
                      return db.getContacts();
                  })
                  .then((contacts)=>{
                      console.log("contacts:", contacts);
                      this.contacts = contacts;
                      RCTDeviceEventEmitter.emit('set_contacts', contacts); 
                      this.setState({
                          dataSource: this.state.dataSource.cloneWithRows(contacts)
                      })
                  })
                  .catch((err) => {
                      console.log("err:", err);
                  });
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

    refreshToken() {
        var profile = ProfileDB.getInstance();
        var url = API_URL + "/auth/refresh_token";
        var obj = {
            refresh_token:profile.refreshToken
        };
        
        return fetch(url, {
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
                return Promise.reject(responseJson.error);
            }
        });
        
    }
    componentWillMount() {
        var profile = ProfileDB.getInstance();
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
        
        ContactDB.getInstance().getContacts()
                 .then((contacts)=>{
                     console.log("contacts:", contacts);
                     this.contacts = contacts;
                     RCTDeviceEventEmitter.emit('set_contacts', contacts); 
                     this.setState({
                         dataSource: this.state.dataSource.cloneWithRows(contacts)
                     })
                 })
                 .then(() => {
                     return db.getDepartments();
                 })
                 .then((depts) => {
                     console.log("departments:", depts);
                     this.departments = depts;
                 })
                 .catch((err) => {
                     console.log("err:", err);
                 });
    
        var now = new Date();
        now = now.getTime()/1000;
        if (now - 60 - profile.expires > 0) {
            console.log("token expires");

            this.refreshToken()
                .then(() => {
                    var db = ContactDB.getInstance();
                    return db.getSyncKey();
                }).then((syncKey) => {
                    this.syncContact(syncKey);
                }).catch((error) => {
                    console.log("error:", error);
                    alert(error);
                });
        } else {
            var db = ContactDB.getInstance();
            db.getSyncKey()
              .then((syncKey)=> {
                  this.syncContact(syncKey);
              });
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

    renderHeader() {
        var navigator = this.props.navigator;
        var p = ProfileDB.getInstance();
        
        var self = this;
        function onPress() {
            console.log("row data:", self.departments);

            navigator.push({
                title:"Department",
                screen:"app.Department",
                navigatorStyle:{
                    tabBarHidden:true
                },
                passProps:{
                    dept_id:0,
                    departments:self.departments,
                    contacts:self.contacts,
                },
            });
        }
        return (
            <TouchableHighlight
                style={{flex:1,
                        height:64,
                        backgroundColor:"white"}}
                activeOpacity={0.6}
                underlayColor={"gray"}
                onPress={onPress}>
                <View style={{flex:1, height:64}}>
                    <View style={{flex:1,
                                  flexDirection:"row",
                                  justifyContent:"space-between",
                                  alignItems:"center"}}>
                        <View style={{flexDirection:"row", alignItems:"center"}}>
                            <Image style={{ marginHorizontal:12,
                                            width:40,
                                            height:40}}
                                   source={require("./Images/department.png")}/>
                            <Text>组织架构</Text>
                        </View>
                        <Image source={require("./Images/right_arrow.png")}/>

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
                    renderHeader={this.renderHeader.bind(this)}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );        
    }

    
}

Contact = connect(function(state){
    return {
        conversations:state.conversations,
    };
})(Contact);

export default Contact;
