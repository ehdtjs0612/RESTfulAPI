const express = require("express");
const router = express.Router();
const createClient = require("../database/connect/postgresql");
const exception = require("../module/exception");
const path = require("path");
const CLIENT_PATH = path.join(__dirname,'../../client/pages');
const { maxUserIdLength, maxPostIdLength, maxPostTitleLength, maxPostContentLength } = require("../module/global");

// 게시글 작성 api
// userId, title, content
router.post("/", async (req, res, next) => {
  const { userId, title, content } = req.body;
  const result = {
    isSuccess: false,
    message: ""
  };
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);
    exception(title, "title").checkInput().checkLength(1, maxPostTitleLength);
    exception(content, "content").checkInput().checkLength(1, maxPostContentLength);

    client = createClient();
    await client.connect();
    const sql = `INSERT INTO post_TB (user_id, title, content) VALUES ($1, $2, $3)`;
    const params = [userId, title, content];
    const data = await client.query(sql, params)
    if (data.rowCount !== 0) {
      result.isSuccess = true;
    }

  } catch (error) {
    console.error(error);
    // input값이 유효하지 않을때, 해당하는 사용자(fk)가 없을때 400반환
    if (error.status === 400) {
      result.message = error.message;
      res.status(400);
    } else if (error.code === '23503') {
      result.message = "해당하는 사용자가 존재하지 않습니다";
      res.status(400);
    } else {
      result.message = "데이터베이스 오류";
      next(new Error("500 error"));
    }

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 모든 게시글 조회 api
// GET
// 명사이자 단수형으로
router.get("/all", async (req, res, next) => {
  const result = {
    data: "",
    message: ""
  };
  let client = null;

  try {
    client = createClient();
    await client.connect();
    const sql = `SELECT post_TB.id, post_TB.title, post_TB.content, post_TB.created_date, user_TB.name AS author_name
               FROM post_TB 
               JOIN user_TB ON post_TB.user_id = user_TB.id 
               ORDER BY created_date DESC LIMIT 8`;
    const data = await client.query(sql);
    if (data.rows.length !== 0) {
      result.data = data.rows;
    } else {
      result.data = null;
      result.message = "게시글이 존재하지 않습니다";
    }

  } catch (error) {
    // 받는 req 값이 없으니 무조건 500 에러만 해당 catch에 걸림.
    console.error(error);
    result.message = "데이터베이스 오류";
    next(new Error("500 Error!"));
    
  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 특정 게시글 조회 api
// postId
// GET
router.get("/:postId",async (req, res, next) => {
  const { postId } = req.params;
  const result = {
    data: "",
    message: ""
  };
  let client = null;
  let trueOrFalse = false;

  try {
    exception(postId, "postId").checkInput().isNumber().checkLength(1, maxPostIdLength);

    client = createClient();
    await client.connect()
    const sql = `SELECT post_TB.*, 
      user_TB.name AS author_name 
      FROM post_TB 
      JOIN user_TB ON post_TB.user_id = user_TB.id 
      WHERE post_TB.id = $1`;
    const params = [postId];

    const data = await client.query(sql, params)
    if (data.rows.length !== 0) {
      result.data = data.rows[0];
    } else {
      // 여기서 해당하는 게시글이 없다면 server.js의 404 error handling으로 바로 갈수있는 방법 없나?
      // 방법이 없으면 여기서 res.sendFile 해서 404.html파일 내려줘야하나?
      result.data = null;
      result.message = "존재하지 않는 게시글입니다";
    }
    /* else {
      result.data = null;
      result.message = "해당하는 게시글이 존재하지 않습니다";
      next(new Error());
    }*/
    
  } catch (error) {
    console.error(error);
    if (error.status === 400) {
      result.message = error.message;
      res.status(400);
    } else {
      result.message = "데이터베이스 오류";
      next(new Error("500 Error!"));
    }

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 게시글 수정 api
// userId, postId, title, content
// PUT
router.put("/", async (req, res, next) => {
  const { postId, userId, title, content } = req.body;
  const result = {
    isSuccess: false,
    message: ""
  };
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);
    exception(postId, "postId").checkInput().isNumber().checkLength(1, maxPostIdLength);
    exception(title, "title").checkInput().checkLength(1, maxPostTitleLength);
    exception(content, "content").checkInput().checkLength(1, maxPostContentLength);

    client = createClient();
    await client.connect();
    const sql = "UPDATE post_TB SET title = $1, content = $2 WHERE user_id = $3 AND id = $4";
    const params = [title, content, userId, postId];
    const data = await client.query(sql, params);

    if (data.rowCount !== 0) {
      result.isSuccess = true;
    } else {
      result.isSuccess = false;
      result.message = "수정 실패, 해당하는 게시글이 존재하지 않습니다";
    }

  } catch (error) {
    console.error(error);
    if (error.status === 400) {
      res.status(400);
      result.message = error.message;
    } else {
      result.message = "데이터베이스 오류";
      next(new Error("500 Error!"));
    }
    
  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 게시글 삭제 api
// userId, postId
// DELETE
router.delete("/", async (req, res, next) => {
  const { postId, userId } = req.body;
  const result = {
    isSuccess: false,
    message: ""
  };
  let client = null;

  try {
    exception(postId, "postId").checkInput().isNumber().checkLength(1, maxPostIdLength);
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);

    client = createClient();
    await client.connect();

    const sql = "DELETE FROM post_TB WHERE id = $1 AND user_id = $2";
    const params = [postId, userId];  
    const data = await client.query(sql, params);

    if (data.rowCount !== 0) {
      result.isSuccess = true;
    } else {
      result.message = "해당하는 게시글이 존재하지 않습니다";
    }

  } catch (error) {
    console.error(error);
    if (error.status === 400) {
      result.message = error.message;
      res.status(400);
    } else {
      result.message = "데이터베이스 오류";
      next(new Error("500 Error!"));
    }

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 특정 사용자가 작성한 게시글 조회 api (로그인 아이디 기반으로)
// userLoginId
// GET
// router.get("/user/:userLoginId", post.getUserPost);

module.exports = router;