import DialogAndroid from 'react-native-dialogs';

var ProgressHUD = {
    show: function(status) {
        var options = {
            title: '',
            content: status ? status : '',
            progress:{
                indeterminate:true
            }
        };

        var dialog = new DialogAndroid();
        dialog.set(options);
        dialog.show();
        this.dialog = dialog;
    },
    
    dismiss: function() {
        this.dialog.dismiss();
    }
}

export default ProgressHUD;
