import React, { PropTypes } from 'react';
import {
    TextInput,
    StyleSheet,
    View,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dismissKeyboard from 'react-native/Libraries/Utilities/dismissKeyboard';

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4dbce9',
    },
    searchBarInput: {
        flex: 1,
        fontWeight: 'normal',
        color: '#212121',
        backgroundColor: 'transparent',
    },
});

export default class SearchBar extends React.Component {

    static propTypes = {
        height: PropTypes.number.isRequired,
        autoCorrect: PropTypes.bool,
        returnKeyType: PropTypes.string,
        onSearchChange: PropTypes.func,
        placeholder: PropTypes.string,
        padding: PropTypes.number,
        inputStyle: PropTypes.object,
        iconCloseName: PropTypes.string,
        iconSearchName: PropTypes.string,
        iconBackName: PropTypes.string,
        placeholderColor: PropTypes.string,
        iconColor: PropTypes.string
    }

    static defaultProps = {
        onSearchChange: () => {},
        inputStyle: {},
        iconCloseName: "md-close",
        iconSearchName: "md-search",
        iconBackName: "md-arrow-back",
        placeholder: "Search...",
        returnKeyType: "search",
        padding: 5,
        placeholderColor: "#bdbdbd",
        iconColor: "#737373"
    }

    constructor(props) {
        super(props);
        this.state = {
            isOnFocus: false,
        };
        this._onFocus = this._onFocus.bind(this);
        this._onBlur = this._onBlur.bind(this);
        this._onClose = this._onClose.bind(this);
        this._onBack = this._onBack.bind(this);
    }

    _onClose() {
        this._textInput.setNativeProps({ text: '' });
        this.props.onSearchChange({ nativeEvent: { text : ''}});
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    _onFocus() {
        this.setState({ isOnFocus: true });
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    }

    _onBlur() {
        this.setState({ isOnFocus: false });
        if (this.props.onBlur) {
            this.props.onBlur();
        }
        this._dismissKeyboard();
    }

    _onBack() {
        dismissKeyboard();
        if (this.props.onBack) {
            this.props.onBack();
        }
    }
    
    _dismissKeyboard () {
        dismissKeyboard()
    }

    render() {
        const {
            height,
            autoCorrect,
            returnKeyType,
            onSearchChange,
            placeholder,
            padding,
            inputStyle,
            iconColor,
            iconBackName,
            iconSearchName,
            iconCloseName,
            placeholderColor
        } = this.props;

        let { iconSize } = this.props

        iconSize = typeof iconSize !== 'undefined' ? iconSize : height * 0.5

        return (
            <View
                onStartShouldSetResponder={this._dismissKeyboard}
                style={{padding: padding }}>
                <View
                    style={
                        [
                            styles.searchBar,
                            {
                                height: height + 10,
                            },
                            inputStyle
                        ]
                          }
                >
                    <TouchableOpacity style={{}}
                                      onPress={this._onBack}>
                        <Icon style={{padding:16}}
                              name={iconBackName} size={height * 0.5}
                              color={iconColor}
                        />
                    </TouchableOpacity>
                    
                    
                    <Icon
                        style={{marginLeft:8}}
                        name={iconSearchName} size={height * 0.5}
                        color={iconColor}
                    />

                    <TextInput
                        autoCorrect={autoCorrect === true}
                        ref={(c) => (this._textInput = c)}
                        returnKeyType={returnKeyType}
                        autoFocus={true}
                        onFocus={this._onFocus}
                        onBlur={this._onBlur}
                        onChangeText={onSearchChange}
                        placeholder={placeholder}
                        placeholderTextColor={placeholderColor}
                        underlineColorAndroid="transparent"
                        style={
                            [styles.searchBarInput,
                             {
                                 paddingLeft: 6,
                                 fontSize: height * 0.4,
                                 color:"white",
                             },
                            ]
                              }
                    />
                    {this.state.isOnFocus ?
                     <TouchableOpacity onPress={this._onClose}>
                         <Icon
                             style={{paddingRight: height * 0.5 }}
                             name={iconCloseName} size={iconSize}
                             color={iconColor}
                         />
                     </TouchableOpacity>
                     : null
                    }
                </View>
            </View>
        );
    }
}
