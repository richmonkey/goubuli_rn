import {
    AsyncStorage
} from 'react-native';

export default class ProfileDB {
    static instance = null;
    static getInstance() {
        if (!ProfileDB.instance) {
            ProfileDB.instance = new ProfileDB()
        }
        return ProfileDB.instance;
    }

    load(cb) {
        var a = [
            AsyncStorage.getItem("accessToken"),
            AsyncStorage.getItem("refreshToken"),
            AsyncStorage.getItem("expires"),
            AsyncStorage.getItem("uid"),
            AsyncStorage.getItem("name"),
            AsyncStorage.getItem("gobelieveToken")
        ];

        Promise.all(a)
               .then((results)=> {
                   var uid = results[3];
                   if (uid) {
                       uid = parseInt(uid);
                   } else {
                       uid = 0;
                   }
                   var expires = results[2];
                   if (expires) {
                       expires = parseInt(expires);
                   } else {
                       expires = 0;
                   }

                   this.accessToken = results[0];
                   this.refreshToken = results[1];
                   this.expires = expires;
                   this.uid = uid;
                   this.name = results[4];
                   this.gobelieveToken = results[5];
                   cb(null, this);
               })
               .catch((e) => {
                   cb(e);
               });
    }

    save(cb) {
        var p = this;
        var a = [
            AsyncStorage.setItem("accessToken", p.accessToken),
            AsyncStorage.setItem("refreshToken", p.refreshToken),
            AsyncStorage.setItem("expires", ""+p.expires),
            AsyncStorage.setItem("uid", ""+p.uid),
            AsyncStorage.setItem("name", p.name),
            AsyncStorage.setItem("gobelieveToken", p.gobelieveToken)
        ];

        Promise.all(a)
               .then((results) => {
                   console.log("save results:", results);
                   cb(null);
               })
               .catch((e) => {
                   cb(e);
               })
        
    }

}
