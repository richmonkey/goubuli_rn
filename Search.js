import React, { Component } from 'react';

import {
    Platform,
    Text,
    View,
    Image,
    ListView,
    TextInput,
    TouchableWithoutFeedback,
    TouchableHighlight,
    TouchableOpacity,
} from 'react-native';

import SearchBar from './SearchBar';
import PeerMessageDB from './chat/PeerMessageDB';
import GroupMessageDB from './chat/GroupMessageDB';

import Searchable from './Searchable';

export default class Search extends Component {

    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',
        drawUnderNavBar:true,
        navBarHidden:true,
    };
    
    constructor(props) {
        super(props);

        this.contacts = this.props.contacts;
        this.groups = this.props.groups;
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            dataSource: ds.cloneWithRows([]),
            searchDataSource:ds.cloneWithRows([]),
            showSearchCancel:false,
            searchText:"",
        };
    }

    onBack() {
        console.log("back...");
        var navigator = this.props.navigator;
        navigator.pop();
    }
    
    render() {
        return (
            <View style={{flex:1, backgroundColor:"white"}}>
               
                <SearchBar
                    onSearchChange={this.onSearchBarChangeText.bind(this)}
                    height={50}
                    onBack={this.onBack.bind(this)}
                    onFocus={() => console.log('On Focus')}
                    onBlur={() => console.log('On Blur')}
                    placeholder={'搜索'}
                    iconColor="white"
                    placeholderColor="gray"
                    autoCorrect={false}
                    padding={0}
                    returnKeyType={'search'}/>

                
                <ListView
                    enableEmptySections={true}
                    dataSource={this.state.searchDataSource}
                    renderRow={this.renderSearchRow.bind(this)}
                />
            </View>
        );
    }
};
Object.assign(Search.prototype, Searchable);
