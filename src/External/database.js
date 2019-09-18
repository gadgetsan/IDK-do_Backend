const async = require("async");
var mysql = require("mysql");
const mysqldump = require("mysqldump");

exports.connection = "";
exports.connectionCount = 0;

var pool = mysql.createPool({
    database: process.env.mysql_database,
    host: process.env.mysql_host,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    multipleStatements: true,
    connectionLimit: 10
});

exports.init = function(callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(err.message);
        }
        callback(connection);
        connection.release();
    });
};

exports.getBackup = function(callback) {
    mysqldump({
        connection: {
            database: process.env.mysql_database,
            host: process.env.mysql_host,
            user: process.env.mysql_user,
            password: process.env.mysql_password
        }
    })
        .then(dump => {
            //console.log(dump);
            //on doit écrire dans la DB qu'un backup à été fait
            exports.init(function(db) {
                db.query("INSERT INTO backups (datetime, filename) VALUES (NOW(), 'nothing')", [], (err, row) => {
                    //console.dir(rows);
                    if (err) {
                        console.error("Error connecting: " + err.stack);
                    }

                    callback(dump.dump.schema + dump.dump.data);
                });
            });
        })
        .catch(error => console.log(error.message));
};
