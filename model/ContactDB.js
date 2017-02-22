
var instance = null;
export default class ContactDB {
    static getInstance() {
        if (!instance) {
            instance = new ContactDB()
        }
        return instance;
    }
    
    constructor() {
        
    }

    setDB(db) {
        this.db = db;
        console.log("set db....");
    }

    updateContacts(contacts) {
        var self = this;
        var p = new Promise(function(resolve, reject) {
            self.db.transaction((tx) => {
                resolve(tx);
            });
        });
        return p.then((tx) => {
            var ps = contacts.map((contact) => {
                console.log("contact:", contact.user_id, contact.name, contact.mobile, contact.email, contact.title, contact.dept_id);
                return new Promise(function(resolve, reject) {
                    tx.executeSql('REPLACE INTO contact (id, name, mobile, email, title, dept_id) VALUES (?, ?, ?, ?, ?, ?)',
                                  [contact.user_id, contact.name, contact.mobile, contact.email, contact.title, contact.dept_id],
                                  (tx, results) => {
                                      console.log("replace result:", results);
                                      resolve();
                                  },
                                  (tx, error) => {
                                      console.log("replace error:", error);
                                      reject(error);
                                      //rollback
                                      return false;
                                  });
                });
            });
            return Promise.all(ps);
        });
    }

    deleteContacts(contacts) {
        var p = new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                resolve(tx);
            });
        });
        return p.then((tx) => {
            var ps = contacts.map((contact) => {
                console.log("delete contact:", contact.user_id);

                return new Promise((resolve, reject) => {
                    tx.executeSql('DELETE FROM contact WHERE id=?',
                                  [contact.user_id],
                                  (tx, results) => {
                                      console.log("delete contact result:", results);
                                      resolve();
                                  },
                                  (tx, error) => {
                                      console.log("delete contact error:", error);
                                      reject(error);
                                  });                       
                });
                  
            })
            return Promise.all(ps);
        });

    }
    
    insertContact(contact) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('INSERT INTO contact (id, name, mobile, email, title, dept_id) VALUES (?, ?, ?, ?, ?, ?)',
                               [contact.user_id, contact.name, contact.mobile, contact.email, contact.title, contact.dept_id],
                               function(result) {
                                   console.log("insert result:", result);
                                   resolve(result.insertId);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });
    }

    updateDepartments(depts) {
        var p = new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                resolve(tx);
            });
        });
        return p.then((tx) => {
            var ps = depts.map((dept) => {
                console.log("dept:", dept.dept_id, dept.name, dept.parent_id);
                return new Promise((resolve, reject) => {
                    tx.executeSql('REPLACE INTO department (id, name, parent_id) VALUES (?, ?, ?)',
                                  [dept.dept_id, dept.name, dept.parent_id],
                                  (tx, results) => {
                                      console.log("replace result:", results);
                                      resolve();
                                  },
                                  (tx, error) => {
                                      console.log("replace error:", error);
                                      reject(error);
                                      //rollback
                                      return false;
                                  });                        
                });
            })
            return Promise.all(ps);
        });
    }
    
    deleteDepartments(depts) {
        var p = new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                resolve(tx);
            });
        });
        return p.then((tx) => {
            var ps = depts.map((dept) => {
                console.log("delete department:", dept.dept_id);
                tx.executeSql('DELETE FROM department WHERE id=?',
                              [dept.dept_id],
                              (tx, results) => {
                                  console.log("delete department result:", results);
                              },
                              (tx, error) => {
                                  console.log("delete department error:", error);
                              });                
            })
            return Promise.all(ps);
        });        
    }
    
    insertDepartment(dept) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('INSERT INTO department (id, name, parent_id) VALUES (?, ?, ?)',
                               [dept.dept_id, dept.parent_id, dept.name],
                               function(result) {
                                   console.log("insert result:", result);
                                   resolve(result.insertId);
                               },
                               function(error) {
                                   reject(error);
                               });
        });
    }

    updateSyncKey(syncKey) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql("REPLACE INTO sync(id, sync_key) VALUES (?, ?)",
                               [1, syncKey],
                               function(result) {
                                   console.log("update sync key result:", result);
                                   resolve();
                               },
                               function(error) {
                                   reject(error);
                               });
        });
    }

    getContacts() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT id, name, mobile, email, title, dept_id FROM contact',
                               [],
                               function(result) {
                                   var msgs = [];
                                   for (var i = 0; i < result.rows.length; i++) {
                                       var row = result.rows.item(i);
                                       console.log("row:", row);
                                       msgs.push(row);
                                   }
                                   resolve(msgs);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });        
    }

    getDepartments() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT id, name, parent_id FROM department',
                               [],
                               function(result) {
                                   var msgs = [];
                                   for (var i = 0; i < result.rows.length; i++) {
                                       var row = result.rows.item(i);
                                       console.log("row:", row);
                                       msgs.push(row);
                                   }
                                   resolve(msgs);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });
    }

    getSyncKey() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT sync_key FROM sync',
                               [],
                               function(result) {
                                   var syncKey = 0;
                                   var msgs = [];
                                   for (var i = 0; i < result.rows.length; i++) {
                                       var row = result.rows.item(i);
                                       syncKey = row.sync_key;
                                       break;
                                   }
                                   resolve(syncKey);
                               },
                               function(error) {
                                   reject(error);
                               });
            
        });        
    }
}
