// 引入测试框架和断言库
const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

// 引入需要测试的模块
const index = require('./index');

const _index = async function (req, res) {
  return new Promise(function (resolve, reject) {
    const _json = res.json;
    const _status = res.status;
    res.status = async function(...args) {
      try {
        _json && await _status.apply(this, args);
      } catch (e) {
        reject(e);
      }
    }
    res.json = async function(...args) {
      try {
        _json && await _json.apply(this, args);
        resolve();
      } catch (e) {
        reject(e);
      }
    }
    index(req, res)
    !_json && resolve();
  })
}

const generateToken = index.generateToken;

// 定义测试套件
describe('index.js', function() {
  // 定义测试用例
  it('should export an express app object', function() {
    // 断言 index 模块导出的是一个 express 应用对象
    expect(index).to.be.an('function');
    expect(index).to.have.property('_router');
    expect(index._router).to.be.an('function');
  });

  it('should use body-parser middleware', function() {
    // 断言 index 模块使用了 body-parser 中间件
    expect(index._router.stack).to.be.an('array');
    expect(index._router.stack.map(item => item.name)).to.include('jsonParser');
  });

  it('should handle GET /public request', async function() {
    // 模拟一个 GET /public 请求
    const req = {
      method: 'GET',
      url: '/public'
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个数组，包含至少一条记录
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.least(1);
        // 断言每条记录都包含 id, song_name, chord_progression, creator, creator_name, created_at, share_status 属性
        for (let item of data) {
          expect(item).to.have.property('id');
          expect(item).to.have.property('song_name');
          expect(item).to.have.property('chord_progression');
          expect(item).to.have.property('creator');
          expect(item).to.have.property('creator_name');
          expect(item).to.have.property('created_at');
          expect(item).to.have.property('share_status');
          // 断言每条记录的 share_status 都是 public
          expect(item.share_status).to.equal('public');
        }
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  it('should handle GET /limited request', async function() {
    var id = await genLimitId(3, 2)
    // 模拟一个 GET /limited 请求，包含 x-token 头部
    const req = {
      method: 'GET',
      url: '/limited',
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个数组，包含至少一条记录
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.least(1);
        // 断言每条记录都包含 id, song_name, chord_progression, creator, creator_name, created_at, share_status 属性
        for (let item of data) {
          expect(item).to.have.property('id');
          expect(item).to.have.property('song_name');
          expect(item).to.have.property('chord_progression');
          expect(item).to.have.property('creator');
          expect(item).to.have.property('creator_name');
          expect(item).to.have.property('created_at');
          expect(item).to.have.property('share_status');
          // 断言每条记录的 share_status 都是 limited
          expect(item.share_status).to.equal('limited');
        }
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  it('should handle GET /mine request', async function() {
    // 模拟一个 GET /mine 请求，包含 x-token 头部
    const req = {
      method: 'GET',
      url: '/mine',
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个数组，包含至少一条记录
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.least(1);
        // 断言每条记录都包含 id, song_name, chord_progression, creator, creator_name, created_at, share_status 属性
        for (let item of data) {
          expect(item).to.have.property('id');
          expect(item).to.have.property('song_name');
          expect(item).to.have.property('chord_progression');
          expect(item).to.have.property('creator');
          expect(item.creator).to.equal(2); // 断言每条记录的 creator 都是 2 
          expect(item).to.have.property('creator_name');
          expect(item.creator_name).to.equal("User1"); // 断言每条记录的 creator_name 都是 User2 
          expect(item).to.have.property('created_at');
          expect(item).to.have.property('share_status');          
        }
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  it('should handle POST / request', async function() {
    // 模拟一个 POST / 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'POST',
      url: '/',
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        song_name: "Test song", 
        chord_progression: [{"chords":[{"root":"C","notes":["C","E","G"],"beats":[16]},{"root":"G","notes":["G","B","D"],"beats":[16]},{"root":"Am","notes":["A","C","E"],"beats":[16]},{"root":"F","notes":["F","A","C"],"beats":[16]}],"loop":1}],
        tags: ["test", "demo"]
       }
    };
    // 调用 index 模块处理请求和响应，并获取返回的 id 值，用于后续测试用例的删除操作
    let id;
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 和 id 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Create success.");
        expect(data.id).to.be.a("number");
        id = data.id;
      }
    };
    await _index(req, res);
  });

  async function genId(createUserId) {
    // 模拟一个 POST / 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'POST',
      url: '/',
      headers: {
        'x-token': generateToken(createUserId || 2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        song_name: "Test song", 
        chord_progression: [{"chords":[{"root":"C","notes":["C","E","G"],"beats":[16]},{"root":"G","notes":["G","B","D"],"beats":[16]},{"root":"Am","notes":["A","C","E"],"beats":[16]},{"root":"F","notes":["F","A","C"],"beats":[16]}],"loop":1}],
        tags: ["test", "demo"]
       }
    };
    // 调用 index 模块处理请求和响应，并获取返回的 id 值，用于后续测试用例的删除操作
    let id;
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 和 id 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Create success.");
        expect(data.id).to.be.a("number");
        id = data.id;
      }
    };
    await _index(req, res);
    return id;
  }

  async function genLimitId(createUserId, sharedUserId) {
    const id = await genId(createUserId);
    // 模拟一个 PUT /:id/share 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'PUT',
      url: '/'+id+'/share', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(createUserId || 2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        share_status: "limited", // 将共享状态修改为有限共享
        limited_users: [sharedUserId], // 指定 userid 为 3 和 4 的用户可以查看
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Share success.");
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
    return id;
  }

  async function genPublicId(createUserId) {
    const id = await genId(createUserId);
    // 模拟一个 PUT /:id/share 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'PUT',
      url: '/'+id+'/share', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(createUserId || 2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        share_status: "public" // 将共享状态修改为公开共享
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Share success.");
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
    return id;
  }

  // 定义后续测试用例需要用到
  // 定义测试用例
  it('should handle PUT /:id request', async function() {
    const id = await genId();
    // 模拟一个 PUT /:id 请求，包含 x-token 头部和 body 属性
    const req = {
    method: 'PUT',
    url: '/'+id, // 使用之前创建的记录的 id
    headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
    },
    body: { 
        song_name: "Test song updated", 
        chord_progression: [{"chords":[{"root":"C","notes":["C","E","G"],"beats":[16]},{"root":"G","notes":["G","B","D"],"beats":[16]},{"root":"Am","notes":["A","C","E"],"beats":[16]},{"root":"F","notes":["F","A","C"],"beats":[16]}],"loop":2}],
        tags: ["test", "demo", "update"]
    }
    };
    // 模拟一个响应对象
    const res = {
    status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
    },
    json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Update success.");
        
    }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  // 定义测试用例
  it('should handle DELETE /:id request', async function() {
    const id = await genId();
    // 模拟一个 DELETE /:id 请求，包含 x-token 头部
    const req = {
      method: 'DELETE',
      url: '/'+id, // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Delete success.");
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  // 定义测试用例
  it('should handle PUT /:id/share request with public share', async function() {
    const id = await genId(2);
    // 模拟一个 PUT /:id/share 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'PUT',
      url: '/'+id+'/share', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        share_status: "public" // 将共享状态修改为公开共享
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Share success.");
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
    
  });

  // 定义测试用例
  it('should handle PUT /:id/share request with limited share', async function() {
    const id = await genId(2);
    // 模拟一个 PUT /:id/share 请求，包含 x-token 头部和 body 属性
    const req = {
      method: 'PUT',
      url: '/'+id+'/share', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(2) // 使用 userid 为 2 的用户的 token
      },
      body: { 
        share_status: "limited", // 将共享状态修改为有限共享
        limited_users: [3], // 指定 userid 为 3 和 4 的用户可以查看
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Share success.");
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
    
  });


  // 定义测试用例
  it('should handle PUT /:id/audit request with pass audit', async function() {
    const id = await genPublicId(2);
    // 模拟一个 PUT /:id/audit 请求，包含 x-token 头部
    const req = {
      method: 'PUT',
      url: '/'+id+'/audit', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(1) // 使用 userid 为 1 的用户的 token，该用户是管理员
      },
      body: {
        audit_status: 'pass'
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 和 record 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Audit success.");
        expect(data.record).to.be.an("object");
        // 断言 record 属性包含 id, song_name, chord_progression, creator, creator_name, created_at, share_status, published_at 属性
        expect(data.record).to.have.property('id');
        expect(data.record).to.have.property('song_name');
        expect(data.record).to.have.property('chord_progression');
        expect(data.record).to.have.property('creator');
        expect(data.record).to.have.property('creator_name');
        expect(data.record).to.have.property('created_at');
        expect(data.record).to.have.property('share_status');
        expect(data.record.share_status).to.equal('public'); // 断言 record 的 share_status 是 public
        expect(data.record).to.have.property('published_at');
        expect(data.record.audit_status).to.equal('pass');
        expect(data.record.published_at).to.not.be.null; // 断言 record 的 published_at 不是 null
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });

  
  it('should handle PUT /:id/audit request with no pass audit', async function() {
    const id = await genPublicId(2);
    // 模拟一个 PUT /:id/audit 请求，包含 x-token 头部
    const req = {
      method: 'PUT',
      url: '/'+id+'/audit', // 使用之前创建的记录的 id
      headers: {
        'x-token': generateToken(1) // 使用 userid 为 1 的用户的 token，该用户是管理员
      },
      body: {
        audit_status: 'nopass'
      }
    };
    // 模拟一个响应对象
    const res = {
      status: function(code) {
        // 断言响应状态码为 200
        expect(code).to.equal(200);
        return this;
      },
      json: function(data) {
        // 断言响应数据为一个对象，包含 message 和 record 属性
        expect(data).to.be.an("object");
        expect(data.message).to.equal("Audit success.");
        expect(data.record).to.be.an("object");
        // 断言 record 属性包含 id, song_name, chord_progression, creator, creator_name, created_at, share_status, published_at 属性
        expect(data.record).to.have.property('id');
        expect(data.record).to.have.property('song_name');
        expect(data.record).to.have.property('chord_progression');
        expect(data.record).to.have.property('creator');
        expect(data.record).to.have.property('creator_name');
        expect(data.record).to.have.property('created_at');
        expect(data.record).to.have.property('share_status');
        expect(data.record.share_status).to.equal('public'); // 断言 record 的 share_status 是 public
        expect(data.record).to.have.property('published_at');
        expect(data.record.audit_status).to.equal('nopass');
        expect(data.record.published_at).to.not.be.null; // 断言 record 的 published_at 不是 null
        
      }
    };
    // 调用 index 模块处理请求和响应
    await _index(req, res);
  });
});
