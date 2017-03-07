import React, { Component } from 'react';
import {
    ActionSheetIOS,
    CameraRoll,
    ListView,
    StyleSheet,
    Navigator,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';

import PhotoBrowser from 'react-native-photo-browser';

export default class Photo extends Component {
    static navigatorStyle = {
        navBarBackgroundColor: '#4dbce9',
        navBarTextColor: '#ffff00',
        navBarSubtitleTextColor: '#ff0000',
        navBarButtonColor: '#ffffff',
        statusBarTextColorScheme: 'light',

        tabBarHidden:true,
        navBarHidden:true,
    };
    
    constructor(props) {
        super(props);
        this.onBack = this.onBack.bind(this);
    }

    onBack() {
        if (Platform.OS === 'android') {
            this.props.navigator.pop();
        } else {
            this.props.navigator.dismissLightBox();
        }
    }

    render() {
        var media = [{
            photo: this.props.url,
        }];
        return (
            <PhotoBrowser
                style={{flex:1}}
                onBack={this.onBack}
                mediaList={media}
                enableGrid={false}
                useCircleProgress/>
        );
    }
}
