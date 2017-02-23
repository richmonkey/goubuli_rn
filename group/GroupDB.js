var instance = null;
export default class GroupDB {
    static getInstance() {
        if (!instance) {
            instance = new GroupDB()
        }
        return instance;
    }
    
    constructor() {
        
    }

    setDB(db) {
        this.db = db;
        console.log("set db....");
    }

    insertGroup(group) {
        var self = this;
        var p = new Promise(function(resolve, reject) {
            self.db.transaction((tx) => {
                resolve(tx);
            });
        });
        return p.then((tx) => {
            var p1 = new Promise(function(resolve, reject) {
                tx.executeSql('INSERT INTO `group` (id, name, master, timestamp) VALUES (?, ?, ?, ?)',
                              [group.id, group.name, group.master, group.timestamp],
                              function(tx, result) {
                                  console.log("insert result:", result);
                                  resolve(result.insertId);
                              },
                              function(tx, error) {
                                  reject(error);
                                  //rollback
                                  return false;
                              });   
            });

            var ps = group.members.map((m) => {
                return new Promise(function(resolve, reject) {
                    tx.executeSql('INSERT INTO `group_member` (group_id, member_id) VALUES (?, ?)',
                                  [group.id, m.uid],
                                  function(tx, result) {
                                      console.log("insert result:", result);
                                      resolve(result.insertId);
                                  },
                                  function(tx, error) {
                                      reject(error);
                                      //rollback
                                      return false;
                                  });   
                });
            });
            ps = ps.concat(p1);
            return Promise.all(ps);
        });
    }


    getGroup(groupID) {
        var self = this;
        var p = new Promise(function(resolve, reject) {
            self.db.executeSql('SELECT m.group_id, m.member_id, g.name, g.master, g.timestamp FROM group_member as m, `group` as g WHERE m.group_id=? AND m.group_id = g.id',
                            [groupID],
                            function(result) {
                                var group = {};
                                var members = [];
                                for (var i = 0; i < result.rows.length; i++) {
                                    var row = result.rows.item(i);
                                    console.log("row:", row);
                                    group.name = row.name;
                                    group.id = row.group_id;
                                    group.master = row.master;
                                    group.timestamp = row.timestamp;
                                    members.push({uid:row.member_id});
                                }

                                group.members = members;

                                resolve(group);
                            },
                            function(error) {
                            });
        });
        return p;
    }

}
