var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  port:4000
});

export const dbConnect = () => {
        con.connect(function(err: any) {
            if (err) throw err;
            console.log("Connected!");
    });
}

/*import { dbConnect } from "./configs/database.config";
dbConnect(); in server if needed*/