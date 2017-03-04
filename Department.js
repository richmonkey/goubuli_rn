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

import ProfileDB from "./model/ProfileDB";

const NODE_CONTACT = "contact";
const NODE_DEPARTMENT = "department";

class Department extends React.Component {
    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
    };
    
    constructor(props) {
        super(props);

        var id = 0;
        var dept_id = this.props.dept_id;

        var depts = this.props.departments.filter((dept)=> {
            return (dept.parent_id == dept_id);
        });
        var contacts = this.props.contacts.filter((contact) => {
            return (contact.dept_id == dept_id);
        });

        var arr1 = depts.map((dept) => {
            var node = {
                id:++id,
                name:dept.name,
                type:NODE_DEPARTMENT,
                departmentID:dept.id,
            };
            return node;
        });
        var arr2 = contacts.map((contact) => {
            var node = {
                id:++id,
                name:contact.name,
                type:NODE_CONTACT,
                contactID:contact.id,
            };
            return node;
        });

        var arr = arr1.concat(arr2);
        
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows(arr)
        };
    }

    componentWillMount() {
        
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
    
    renderRow(node) {
        var navigator = this.props.navigator;
        
        var self = this;
        function onPress() {
            console.log("row data:", node);
            if (node.type == NODE_CONTACT) {
                var profile = ProfileDB.getInstance();
                var token = profile.gobelieveToken;
                var uid = profile.uid;

                navigator.popToRoot({animated:false});
                navigator.push({
                    title:node.name,
                    screen:"chat.PeerChat",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        sender:uid,
                        receiver:node.contactID,
                        peer:node.contactID,
                        name:node.name,
                        token:token,
                    },
                });
            } else if (node.type == NODE_DEPARTMENT) {
                navigator.push({
                    title:node.name,
                    screen:"app.Department",
                    navigatorStyle:{
                        tabBarHidden:true
                    },
                    passProps:{
                        dept_id:node.departmentID,
                        departments:self.props.departments,
                        contacts:self.props.contacts,
                    },
                });                
            }
        }

        var image = (node.type == NODE_CONTACT ? require("./Images/default.png") : require("./Images/department.png"));
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
                                   source={image}/>
                        </View>
                        <View style={{flex:1,
                                      marginLeft:12,
                                      flexDirection:"row"}}>
                            <Text style={{fontWeight:"bold"}}>
                                {node.name}
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
            <View style={{flex: 1,
                          backgroundColor:"white"}}>
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow.bind(this)}
                />
            </View>
        );        
    }

    
}


export default Department;
