import React, { Component } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    Dimensions
} from 'react-native';

import { Navigation } from 'react-native-navigation';

var {height, width} = Dimensions.get('window');
export default class ProgressHud extends Component {
    render() {
        return (
            <View style={{flex:1,
                          alignItems:"center",
                          justifyContent:"center",
                          width:width,
                          height:height,
                          backgroundColor:"rgba(0, 0, 0, 0.11)"}}>
                <View style={{padding:16,
                              borderRadius:16,
                              backgroundColor:"white"}}>
                    <ActivityIndicator
                        animating={true}
                        style={{width:80, height: 80}}
                        size="large"
                    />
                </View>
            </View>
        );
    }
}



const styles = StyleSheet.create({
    centering: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    gray: {
        backgroundColor: '#cccccc',
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 8,
    },
});



export function showProgressHud() {
    Navigation.showLightBox({
        screen:"lib.ProgressHud",
    })
}

export function hideProgressHud() {
    Navigation.dismissLightBox();
}
