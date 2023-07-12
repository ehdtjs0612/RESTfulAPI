const express = require("express");
const router = express.Router();
const createClient = require("../database/connect/postgresql");
const exception = require("../module/exception");
const { maxUserIdLength, maxLoginIdLength, maxPwLength, maxNameLength, maxPhoneNumberLength, maxEmailLength } = require("../module/global");


// 로그인 api
// loginId, password
// POST
router.post("/login", async (req, res) => {
  const { loginId, password } = req.body;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  };
  let client = null;

  try {
    exception(loginId, "loginId").checkInput().checkLength(1, maxLoginIdLength);
    exception(password, "password").checkInput().checkLength(1, maxPwLength);

    client = createClient();
    await client.connect();
    const sql = "SELECT id FROM user_TB WHERE login_id = $1 AND password = $2";
    const params = [loginId, password];

    const data = await client.query(sql, params);
    if (data.rows.length !== 0) {
      result.isSuccess = true;
      result.data = data.rows[0].id;
    } else {
      result.message = "아이디 또는 비밀번호가 올바르지 않습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  };
});

// 회원가입 api
// loginId, password, name, phoneNumber, email
// POST
router.post("/signup", async (req, res) => {
  const { loginId, password, name, phoneNumber, email } = req.body;
  const result = {
    isSuccess: false,
    data: "",
    message: "",
  };
  let client = null;

  try {
    exception(loginId, "loginId").checkInput().checkIdRegex();
    exception(password, "password").checkInput().checkPwRegex();
    exception(name, "name").checkInput().checkNameRegex();
    exception(phoneNumber, "phoneNumber").checkInput().checkPhoneNumberRegex();
    exception(email, "email").checkInput().checkEmailRegex();

    client = createClient();
    await client.connect();
    const sql = `INSERT INTO user_TB (login_id, password, name, phone_number, email) VALUES ($1, $2, $3, $4, $5)`;
    const params = [loginId, password, name, phoneNumber, email];

    const data = await client.query(sql, params);
    if (data.rowCount !== 0) {
      result.isSuccess = true;
      result.message = "회원가입 성공";
    }

  } catch (error) {
    console.error(error)
    result.message = error.message;

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  };
});

// 아이디 찾기 api
// name, phoneNumber, email
// GET
router.get("/loginId", async (req, res) => {
  const { name, phoneNumber, email } = req.query;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(name, "name").checkInput().checkLength(1, maxNameLength);
    exception(phoneNumber, "phoneNumber").checkInput().checkLength(maxPhoneNumberLength, maxPhoneNumberLength);
    exception(email, "email").checkInput().checkLength(1, maxEmailLength);

    client = createClient();
    await client.connect();
    const sql = "SELECT login_id FROM user_TB WHERE name = $1 AND phone_number = $2 AND email = $3";
    const params = [name, phoneNumber, email];
    const data = await client.query(sql, params);
    if (data.rows.length !== 0) {
      result.isSuccess = true;
      result.data = data.rows[0].login_id;
    } else {
      result.message = "해당하는 아이디가 존재하지 않습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
})

// 비밀번호 찾기 api
// 1.(사용자 인증 단계)
// GET
// loginId, name, phoneNumber, email
router.get("/pw", async (req, res) => {
  const { loginId, name, phoneNumber, email } = req.query;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(loginId, "loginId").checkInput().checkLength(1, maxLoginIdLength);
    exception(name, "name").checkInput().checkLength(1, maxNameLength)
    exception(phoneNumber, "phoneNumber").checkInput().checkLength(maxPhoneNumberLength, maxPhoneNumberLength);

    client = createClient();
    await client.connect();
    const sql = `SELECT id FROM user_TB WHERE login_id = $1 AND name = $2 AND phone_number = $3 AND email = $4`;
    const params = [loginId, name, phoneNumber, email];
    const data = await client.query(sql, params);
    if (data.rows.length !== 0) {
      result.isSuccess = true;
      result.data = data.rows[0].id;
    } else {
      result.message = "해당하는 사용자가 없습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 비밀번호 찾기 api
// 2.(비밀번호 재설정 단계)
// PUT
// userId, newPw
router.put("/pw", async (req, res) => {
  const { userId, newPw } = req.body;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);
    exception(newPw, "newPw").checkInput().checkPwRegex();

    client = createClient();
    await client.connect();
    const sql = "UPDATE user_TB SET password = $1 WHERE id = $2";
    const param = [newPw, userId];
    const data = await client.query(sql, param);
    if (data.rowCount !== 0) {
      result.isSuccess = true;

    } else {
      result.message = "해당하는 사용자가 없습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;

  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 프로필 보기 api
// userId
// GET
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);

    client = createClient();
    await client.connect();
    const sql = `SELECT login_id, name, phone_number, email, created_date, updated_date 
                    FROM user_TB WHERE id = $1`;
    const params = [userId];
    const data = await client.query(sql, params);
    if (data.rows.length !== 0) {
      result.isSuccess = true;
      result.data = data.rows[0];
    } else {
      result.message = "해당하는 사용자가 존재하지 않습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;
  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 회원 정보 수정 api
// userId, name, phoneNumber, email
// PUT
router.put("/", async (req, res) => {
  const { userId, name, phoneNumber, email } = req.body;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);
    exception(name, "name").checkInput().checkNameRegex();
    exception(phoneNumber, "phoneNumber").checkInput().checkPhoneNumberRegex();
    exception(email, "email").checkInput().checkEmailRegex();
    
    client = createClient();
    await client.connect();
    const sql = "UPDATE user_TB SET name = $1, phone_number = $2, email = $3 WHERE id = $4";
    const params = [name, phoneNumber, email, userId];
    const data = await client.query(sql, params)
    if (data.rowCount !== 0) {
      result.isSuccess = true;
    } else {
      result.message = "해당하는 사용자가 없습니다";
    }

  } catch (error) {
    console.error(error);
    result.message = error.message;
  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

// 회원 탈퇴 api
// userId
// DELETE
router.delete("/", async (req, res) => {
  const { userId } = req.body;
  const result = {
    isSuccess: false,
    data: "",
    message: ""
  }
  let client = null;

  try {
    exception(userId, "userId").checkInput().isNumber().checkLength(1, maxUserIdLength);

    client = createClient();
    await client.connect();
    const sql = "DELETE FROM user_TB WHERE id = $1";
    const params = [userId];
    const data = await client.query(sql, params);
    if (data.rowCount !== 0) {
      result.isSuccess = true;
    } else {
      result.message = "해당하는 사용자가 존재하지 않습니다";
    }
    
  } catch (error) {
    console.error(error);
    result.message = error.message;
    
  } finally {
    if (client) {
      await client.end();
    }
    res.send(result);
  }
});

module.exports = router;