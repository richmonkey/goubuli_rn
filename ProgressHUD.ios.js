
import SVProgressHUD from './SVProgressHUD';

var ProgressHUD = {
    show: function(status) {
        SVProgressHUD.show(status ? status : "");
    },
    dismiss: function() {
        SVProgressHUD.dismiss();
    }
};

export default ProgressHUD;
