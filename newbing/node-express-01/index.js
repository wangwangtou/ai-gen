// 引入express模块
var express = require('express');

// 引入body-parser模块
var bodyParser = require('body-parser');

// 创建express应用
var app = express();

// 使用body-parser中间件解析json格式的请求体
app.use(bodyParser.json());

// 引入sqlite3模块
var sqlite3 = require('sqlite3');

// 引入jsonwebtoken模块
var jwt = require('jsonwebtoken');

// 引入crypto模块
var crypto = require('crypto');

// 定义JWT_SECRET AES_KEY AES_IV
var JWT_SECRET = 'a1b2c3d4e5f6g7h8i9j0';
const AES_KEY = Buffer.from("374d4126fdfc883dbf5edd7d2051ac4b7515872bbaa7bc3c5e64af73e9380d6d", "hex");
const AES_IV = Buffer.from("efdcf98c534e77bd3be104b2bdf960cd", "hex");

// 创建数据库连接
var db = new sqlite3.Database('./mcu.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the mcu database.');
    // 初始化数据库
    initDatabase();
  }
});

// 定义一个Promise化的db.run方法
function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// 定义一个Promise化的db.get方法
function get(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// 定义一个Promise化的db.all方法
function all(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
// 初始化一些数据的函数
async function initData() {
  // 定义SQL语句
  var sql1 = `INSERT INTO user(username, nickname, role)
              VALUES(?, ?, ?)`;

  var sql2 = `INSERT INTO chord_progression(song_name, chord_progression, creator, share_status)
              VALUES(?, ?, ?, ?)`;

  // 开启事务                
  try {

    await run("BEGIN TRANSACTION");

    // 插入三个用户
    await run(sql1, ['admin', 'Admin', 'admin']);
    await run(sql1, ['user1', 'User1', 'user']);
    await run(sql1, ['user2', 'User2', 'user']);

    // 插入五条和弦进行
    await run(sql2, ['Let it be', '[{"chords":[{"root":"C","notes":["C","E","G","E"],"beats":[16,16,16,16]},{"root":"G","notes":["G","B","D","B"],"beats":[16,16,16,16]},{"root":"Am","notes":["A","C","E","C"],"beats":[16,16,16,16]},{"root":"F","notes":["F","A","C","A"],"beats":[16,16,16,16]}],"loop":2},{"chords":[{"root":"C","notes":["C","E","G","E"],"beats":[16,16,16,16]},{"root":"G","notes":["G","B","D","B"],"beats":[16,16,16,16]},{"root":"F","notes":["F","A","C","A"],"beats":[24,8]},{"root":"C","notes":["C","E","G","E"],"beats":[32]}],"loop":1}]', 2, 'public']);
    await run(sql2, ['Canon in D', '[{"chords":[{"root":"D","notes":["D","F#","A"],"beats":[32]},{"root":"A/C#","notes":["C#","E","A"],"beats":[32]},{"root":"Bm/F#","notes":["F#","A","D"],"beats":[32]},{"root":"F#m/A","notes":["A","C#","F#"],"beats":[32]}],"loop":1},{"chords":[{"root":"G/D","notes":["D","G","B"],"beats":[32]},{"root":"D/F#","notes":["F#","A","D"],"beats":[32]},{"root":"G/A/B/D/F#(omit3)","notes":["A,B,D,F#"],"beats":[32]},{"root":"A/C#/E/G#(omit5)","notes":["C#,E,G#"],"beats":[32]}],"loop":1}]', 2, 'limited']);
    await run(sql2, ['Happy birthday', '[{"chords":[{"root":"C", "notes":["C", "E", "G"], "beats":[8]}, {"root":"C", "notes":["C", "E", "G"], "beats":[8]}, {"root":"G", "notes":["G", "B", "D"], "beats":[8]}, {"root":"G", "notes":["G", "B", "D"], "beats":[8]}], "loop":1}, {"chords":[{"root":"A", "notes":["A", "C#", "E"], "beats":[8]}, {"root":"A", "notes":["A", "C#", "E"], "beats":[8]}, {"root":"G", "notes":["G", "B", "D"], "beats":[12]}, {"root":null,"notes":null,"beats":[4]}], "loop":1}, {"chords":[{"root":"F", "notes":["F", "A", "C"], "beats":[8]}, {"root":"F", "notes":["F", "A", "C"], "beats":[8]}, {"root":"E", "notes":["E", "G#", "B"], "beats":[8]}, {"root":"E", "notes":["E", "G#", "B"], "beats":[8]}], "loop":1}, {"chords":[{"root":"D", "notes":["D", "F#", "A"],"beats":[8]}, {"root":"D", "notes":["D", "F#", "A"],"beats":[8]}, {"root":"C", "notes":["C", "E", "G"],"beats":[12]}, {"root":null,"notes":null,"beats":[4]}], loop:1}]', 3, 'private']);
    await run(sql2, ['Twinkle twinkle little star', '[{"chords":[{"root":"C", notes:["CEG"], beats:[0x10]}, {"root":"C", notes:["CEG"], beats:[0x10]}, {"root":"G", notes:["GBD"], beats:[0x10]}, {"root":"G", notes:["GBD"], beats:[0x10]}], loop:1}, {"chords":[{"root":"A/C#", notes:["AC#E"], beats:[0x10]}, {"root":"A/C#", notes:["AC#E"], beats:[0x10]}, {"root":"G/E/B/D/F#", notes:["EBDF#"], beats:[0x18]}, {"root":null,"notes":null,"beats":[0x08]}], loop:1}, {"chords":[{"root":"F/A/C/E/G/Bb/D/F#", notes:["ACEGBbDF#"], beats:[0x10]}, {"root":"F/A/C/E/G/Bb/D/F#", notes:["ACEGBbDF#"], beats:[0x10]}, {"root":"E/G#/B/D/F#/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/Eb/Gb/Bb/Db/F/Ab/C/E (omit3)", notes:["EGDBFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGbBbdFAcEbGb (omit3)"], beats:[0x10]}, {"root":"D/A/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E (omit5)", notes:["ADFAcEGBDFAcEGBDFAcEGBDFAcEGBDFAcEGBDFAcEGBDFAcEGBDFAcEGBDFAcEGBD (omit5)"], beats:[0x10]}], loop:1}, {"chords":[{"root":"D/A/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E/G/B/D/F#/Ab/C/E (omit5)", notes:["ADFAcEGBDFAcEGBDFAcEGBD (omit5)"], beats:[0x20]}, {"root":null,"notes":null,"beats":[0x20]}], loop:1}]', 3, 'public']);
    await run(sql2, ['Someone like you', '[{"chords":[{"root":null,"notes":null,"beats":[0x20]},{"root":null,"notes":null,"beats":[0x20]},{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"chords":[{"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2,"loop":2}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":4}],"loop":-1}], loop:1}]', 2, 'private']);

    await run("COMMIT");
    console.log('Inserted some data.');

  } catch (err) {
    await run("ROLLBACK");
    console.error(err.message);
  }
}


// 初始化数据库的函数
async function initDatabase() {
  // 创建用户表
  try {
    await run(`CREATE TABLE IF NOT EXISTS user (
      userid INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL
    )`);
    console.log('Created user table.');
  } catch (err) {
    console.error(err.message);
  }

  // 创建和弦进行表
  try {
    await run(`CREATE TABLE IF NOT EXISTS chord_progression (
      id INTEGER PRIMARY KEY,
      song_name TEXT NOT NULL,
      chord_progression TEXT NOT NULL,
      creator INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      share_status TEXT NOT NULL CHECK (share_status IN ('private', 'limited', 'public')),
      published_at DATETIME,
      FOREIGN KEY (creator) REFERENCES user (userid)
    )`);
    console.log('Created chord_progression table.');
  } catch (err) {
    console.error(err.message);
  }

  // 创建标签表
  try {
    await run(`CREATE TABLE IF NOT EXISTS tag (
      id INTEGER PRIMARY KEY,
      tag_name TEXT NOT NULL UNIQUE
    )`);
    console.log('Created tag table.');
  } catch (err) {
    console.error(err.message);
  }

  // 创建和弦进行标签关联表
  try {
    await run(`CREATE TABLE IF NOT EXISTS chord_progression_tag (
      chord_progression_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (chord_progression_id, tag_id),
      FOREIGN KEY (chord_progression_id) REFERENCES chord_progression (id),
      FOREIGN KEY (tag_id) REFERENCES tag (id)
    )`);
    console.log('Created chord_progression_tag table.');
  } catch (err) {
    console.error(err.message);
  }

  // 创建有限共享人表
  try {
    await run(`CREATE TABLE IF NOT EXISTS limited_share (
      chord_progression_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (chord_progression_id, user_id),
      FOREIGN KEY (chord_progression_id) REFERENCES chord_progression (id),
      FOREIGN KEY (user_id) REFERENCES user (userid)
    )`);
    console.log('Created limited_share table.');
  } catch (err) {
    console.error(err.message);
  }

  try {
    var row = await get(`SELECT * FROM user WHERE username = 'admin'`);
    if (!row) {
      await initData()
    }
  } catch (err) {
    console.error(err.message);
  }
}

// 启动web服务器
startServer();

// 启动web服务器的函数
async function startServer() {
  if (process.argv[process.argv.length - 2] == 'gentoken') {
    console.log(generateToken(process.argv[process.argv.length - 1]))
    return;
  }

  // 定义端口号
  var port = process.env.PORT || 3000;

  // 监听端口号
  app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
  });

  // 定义公开共享查询接口，查询所有的公开共享数据
  app.get('/public', async (req, res) => {
    var sql = `SELECT cp.*, u.nickname AS creator_name, t.tag_name AS tag_name FROM chord_progression AS cp 
               JOIN user AS u ON cp.creator = u.userid 
               LEFT JOIN chord_progression_tag AS cpt ON cp.id = cpt.chord_progression_id 
               LEFT JOIN tag AS t ON cpt.tag_id = t.id 
               WHERE cp.share_status = 'public'`;

    try {
      var rows = await all(sql, []);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 定义有限共享查询接口，查询所有共享给当前登录人的数据
  app.get('/limited', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    var sql = `SELECT cp.*, u.nickname AS creator_name, t.tag_name AS tag_name FROM chord_progression AS cp 
                JOIN user AS u ON cp.creator = u.userid 
                LEFT JOIN chord_progression_tag AS cpt ON cp.id = cpt.chord_progression_id 
                LEFT JOIN tag AS t ON cpt.tag_id = t.id 
                JOIN limited_share AS ls ON cp.id = ls.chord_progression_id 
                WHERE cp.share_status = 'limited' AND ls.user_id = ?`;

    try {
      var rows = await all(sql, [currentUser.userid]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 定义我的查询接口，查询创建人是当前登录人的数据
  app.get('/mine', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    var sql = `SELECT cp.*, u.nickname AS creator_name, t.tag_name AS tag_name FROM chord_progression AS cp 
                JOIN user AS u ON cp.creator = u.userid 
                LEFT JOIN chord_progression_tag AS cpt ON cp.id = cpt.chord_progression_id 
                LEFT JOIN tag AS t ON cpt.tag_id = t.id 
                WHERE cp.creator = ?`;

    try {
      var rows = await all(sql, [currentUser.userid]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 定义创建接口，默认共享状态为私有
  app.post('/', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    // 获取请求体中的参数
    var song_name = req.body.song_name;
    var chord_progression = req.body.chord_progression;
    var tags = req.body.tags;

    // 验证参数是否合法
    if (!song_name || !chord_progression || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }

    // 定义SQL语句
    var sql1 = `INSERT INTO chord_progression(song_name, chord_progression, creator, share_status)
                VALUES(?, ?, ?, 'private')`;

    var sql2 = `INSERT INTO tag(tag_name)
                VALUES(?)`;

    var sql3 = `INSERT INTO chord_progression_tag(chord_progression_id, tag_id)
                VALUES(?, ?)`;

    // 开启事务                
    try {

      await run("BEGIN TRANSACTION");

      var result1 = await run(sql1, [song_name, JSON.stringify(chord_progression), currentUser.userid]);
      var lastId = result1.lastID;

      for (let tag of tags) {
        var result2 = await run(sql2, [tag]);
        var lastId2 = result2.lastID;
        await run(sql3, [lastId, lastId2]);
      }

      await run("COMMIT");
      res.json({ message: "Create success.", id: lastId });

    } catch (err) {
      await run("ROLLBACK");
      res.status(500).json({ error: err.message });
    }
  });
  // 定义更新接口， 只允许创建人对共享状态不是公开共享的记录进行更新
  app.put('/:id', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    // 获取请求参数中的id
    var id = req.params.id;

    // 获取请求体中的参数
    var song_name = req.body.song_name;
    var chord_progression = req.body.chord_progression;
    var tags = req.body.tags;

    // 验证参数是否合法
    if (!song_name || !chord_progression || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }

    var sql1 = `UPDATE chord_progression SET song_name = ?, chord_progression = ?
              WHERE id = ? AND creator = ? AND share_status <> 'public'`;

    var sql2 = `DELETE FROM chord_progression_tag WHERE chord_progression_id = ?`;

    var sql3 = `INSERT OR IGNORE INTO tag(tag_name)
              VALUES(?)`;

    var sql4 = `INSERT INTO chord_progression_tag(chord_progression_id, tag_id)
              VALUES(?, ?)`;

    // 开启事务                
    try {

      await run("BEGIN TRANSACTION");

      var result1 = await run(sql1, [song_name, JSON.stringify(chord_progression), id, currentUser.userid]);

      if (result1.changes == 0) {
        return res.status(403).json({ error: "Update failed. No such record or not allowed to update." });
      }

      await run(sql2, [id]);

      for (let tag of tags) {
        var result2 = await run(sql3, [tag]);
        var lastId2 = result2.lastID;
        await run(sql4, [id, lastId2]);
      }

      await run("COMMIT");
      res.json({ message: "Update success." });

    } catch (err) {
      await run("ROLLBACK");
      res.status(500).json({ error: err.message });
    }
  });

  // 定义删除接口，只允许创建人对记录进行删除
  app.delete('/:id', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    // 获取请求参数中的id
    var id = req.params.id;

    var sql1 = `DELETE FROM chord_progression WHERE id = ? AND creator = ?`;

    var sql2 = `DELETE FROM chord_progression_tag WHERE chord_progression_id = ?`;

    var sql3 = `DELETE FROM limited_share WHERE chord_progression_id = ?`;

    // 开启事务                
    try {

      await run("BEGIN TRANSACTION");

      var result1 = await run(sql1, [id, currentUser.userid]);

      if (result1.changes == 0) {
        return res.status(403).json({ error: "Delete failed. No such record or not allowed to delete." });
      }

      await run(sql2, [id]);
      await run(sql3, [id]);

      await run("COMMIT");
      res.json({ message: "Delete success." });

    } catch (err) {
      await run("ROLLBACK");
      res.status(500).json({ error: err.message });
    }
  });

  // 定义共享设置接口，只允许创建人对记录进行共享状态的修改
  app.put('/:id/share', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    // 获取请求参数中的id
    var id = req.params.id;

    // 获取请求体中的参数
    var share_status = req.body.share_status;
    var limited_users = req.body.limited_users;

    // 验证参数是否合法
    if (!share_status || !['private', 'limited', 'public'].includes(share_status)) {
      return res.status(400).json({ error: 'Invalid share status.' });
    }

    if (share_status == 'limited' && !Array.isArray(limited_users)) {
      return res.status(400).json({ error: 'Invalid limited users.' });
    }

    var sql1 = `UPDATE chord_progression SET share_status = ?, published_at = CASE WHEN share_status <> 'public' AND ? = 'public' THEN CURRENT_TIMESTAMP ELSE published_at END 
             WHERE id = ? AND creator = ?`;

    var sql2 = `DELETE FROM limited_share WHERE chord_progression_id = ?`;

    var sql3 = `INSERT INTO limited_share(chord_progression_id, user_id)
             VALUES(?, ?)`;

    // 开启事务                
    try {

      await run("BEGIN TRANSACTION");

      var result1 = await run(sql1, [share_status, share_status, id, currentUser.userid]);

      if (result1.changes == 0) {
        return res.status(403).json({ error: "Share failed. No such record or not allowed to share." });
      }

      if (share_status == 'limited') {

        await run(sql2, [id]);

        for (let user of limited_users) {
          await run(sql3, [id, user]);
        }
      }

      await run("COMMIT");
      res.json({ message: "Share success." });

    } catch (err) {
      await run("ROLLBACK");
      res.status(500).json({ error: err.message });
    }
  });

  // 定义公开共享审核接口，对于修改共享状态为公开共享的记录，由管理员进行操作，对其进行审核，审核通过过才能由公开共享接口查询到
  app.put('/:id/audit', async (req, res) => {

    // 获取当前登录用户信息
    var currentUser = await getCurrentUser(req);

    // 如果没有获取到用户信息，返回错误信息
    if (!currentUser) {
      return res.status(401).json({ error: 'No current user found.' });
    }

    // 如果当前登录用户不是管理员，返回错误信息
    if (currentUser.role != 'admin') {
      return res.status(403).json({ error: 'Not allowed to audit. Only admin can do it.' });
    }

    // 获取请求参数中的id
    var id = req.params.id;

    var sql1 = `UPDATE chord_progression SET published_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND share_status = 'public' AND published_at IS NULL`;

    var sql2 = `SELECT cp.*, u.nickname AS creator_name FROM chord_progression AS cp 
             JOIN user AS u ON cp.creator = u.userid 
             WHERE cp.id = ?`;

    // 开启事务                
    try {

      await run("BEGIN TRANSACTION");

      var result1 = await run(sql1, [id]);

      if (result1.changes == 0) {
        return res.status(403).json({ error: "Audit failed. No such record or not allowed to audit." });
      }

      var row = await get(sql2, [id]);
      res.json({ message: 'Audit success.', record: row });

      await run("COMMIT");

    } catch (err) {
      await run("ROLLBACK");
      res.status(500).json({ error: err.message });
    }
  });

  // 定义生成token的方法，传入userid，返回包含userid的jwt token的AES加密后的base64的值
  function generateToken(userid) {

    // 创建一个jwt token，包含userid和过期时间（一小时）
    var token = jwt.sign({ userid: userid }, JWT_SECRET, { expiresIn: '1h' });

    // 创建一个aes加密器，使用aes-256-cbc算法，AES_KEY和AES_IV作为密钥和初始向量
    var cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);

    // 对token进行aes加密，并转换为base64格式
    var encryptedToken = cipher.update(token, 'utf8', 'base64') + cipher.final('base64');

    // 返回加密后的token
    return encryptedToken;
  }

  // 定义从token中读取userid的方法，通过AES解密后，验证jwttoken，返回userid
  function getUserIdFromToken(token) {

    try {
      // 创建一个aes解密器，使用aes-256-cbc算法，AES_KEY和AES_IV作为密钥和初始向量
      var decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, AES_IV);

      // 对token进行aes解密，并转换为utf8格式
      var decryptedToken = decipher.update(token, 'base64', 'utf8') + decipher.final('utf8');

      // 验证jwt token，并获取其中的payload
      var payload = jwt.verify(decryptedToken, JWT_SECRET);

      // 返回payload中的userid
      return payload.userid;

    } catch (err) {
      // 如果发生任何错误，返回null
      return null;
    }
  }

  // 定义获取当前登录用户信息的方法，从header中获取x-token的值，获取到userid，正确之后用userid去数据库查询用户信息，返回用户表单条记录的json格式
  async function getCurrentUser(req) {

    // 从header中获取x-token的值
    var token = req.headers['x-token'];

    // 如果没有token，返回null
    if (!token) {
      return null;
    }

    // 从token中读取userid
    var userid = getUserIdFromToken(token);

    // 如果没有userid，返回null
    if (!userid) {
      return null;
    }

    // 定义SQL语句，根据userid查询用户表单条记录
    var sql = `SELECT * FROM user WHERE userid = ?`;

    // 异步执行SQL语句，并返回结果（如果有）
    try {
      var row = await get(sql, [userid]);
      return row;
    } catch (err) {
      // 如果发生任何错误，返回null
      return null;
    }
  }
}

