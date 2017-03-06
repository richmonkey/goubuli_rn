
const CONTACT_SYNC_KEY_ID = 1;
const MESSAGE_SYNC_KEY_ID = 2;

export default class SyncKeyDB {
    static instance = null;
    static getInstance() {
        if (!SyncKeyDB.instance) {
            SyncKeyDB.instance = new SyncKeyDB()
        }
        return SyncKeyDB.instance;
    }

    setDB(db) {
        this.db = db;
        console.log("set db....");
    }
    
    updateContactSyncKey(syncKey) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql("REPLACE INTO sync(id, sync_key) VALUES (?, ?)",
                               [CONTACT_SYNC_KEY_ID, syncKey],
                               function(result) {
                                   console.log("update sync key result:", result);
                                   resolve();
                               },
                               function(error) {
                                   reject(error);
                               });
        });
    }

    updateMessageSyncKey(syncKey) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql("REPLACE INTO sync(id, sync_key) VALUES (?, ?)",
                               [MESSAGE_SYNC_KEY_ID, syncKey],
                               function(result) {
                                   console.log("update sync key result:", result);
                                   resolve();
                               },
                               function(error) {
                                   reject(error);
                               });
        });        
    }
    
    getContactSyncKey() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT sync_key FROM sync WHERE id=?',
                               [CONTACT_SYNC_KEY_ID],
                               function(result) {
                                   var syncKey = 0;
                                   var msgs = [];
                                   if (result.rows.length > 0) {
                                       var row = result.rows.item(0);
                                       syncKey = row.sync_key;
                                   } else {
                                       syncKey = 0;
                                   }
                                   resolve(syncKey);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });        
    }

    getMessageSyncKey() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT sync_key FROM sync WHERE id=?',
                               [MESSAGE_SYNC_KEY_ID],
                               function(result) {
                                   var syncKey = 0;
                                   var msgs = [];
                                   if (result.rows.length > 0) {
                                       var row = result.rows.item(0);
                                       syncKey = row.sync_key;
                                   } else {
                                       syncKey = 0;
                                   }
                                   resolve(syncKey);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });
    }
}
