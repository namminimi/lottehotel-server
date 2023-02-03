//common js구문
//모듈 import ---> require("모듈")
//express
const express = require('express');
const cors = require('cors');

const mysql = require('mysql');
const multer = require('multer');
const bcrypt = require('bcrypt');
const saltRounds = 10; //변경횟수




//서버 생성
const app = express();
//프로세서의 주소 포트번호 지정
const port = 8080;

//브라우저의 cors이슈를 막기위해 사용
/* 서버에 요청하면 응답을 하는 구조
서버 주소와 브라우저 구조가 일치하지 않으면 거부하는 경우가 있음
모든 브라우저의 경로를 다 받겠다할때 cors */
app.use(cors())
//json형식 데이터를 처리하도록 설정
app.use(express.json());
// upload폴더 클라이언트에서 접근 가능하도록 설정
app.use("/upload", express.static("upload"));
//Storage 생성
const storage = multer.diskStorage({
    destination: (req, file, cd)=>{
        cd(null, 'upload/event/');
    },
    filename: (req, file, cd)=>{
        cd(null, file.originalname);
    }
})

//upload 객체 생성하기
const upload = multer({ storage: storage })

//upload경로로 post요청시 응답 구현하기
app.post("/upload", upload.single("file"), (req,res)=>{
    res.send({
        imageUrl: req.file.fieldname
    })
})


//mysql연결 생성
const conn = mysql.createConnection({
    host: "hera-database.c6v9c00axeyk.ap-northeast-2.rds.amazonaws.com",
    user: "admin",
    password: "alstjq12$!!",
    port: "3306",
    database: "hotel"   
})

//선연결(mysql접속)
conn.connect();

//conn.query("쿼리문", 콜백함수)
app.get('/special', (req,res)=> {
    conn.query("select * from event where e_category = 'special'",
    function(error, result, fields){
        res.send(result);
    }) //fields는 mysql의 칼럼을 받음
})

//req {params: {no:1}}
app.get("/special/:no", (req,res)=>{
    const {no} = req.params;
    conn.query(`select * from event where e_category = 'special' and e_no=${no}`,
    function(error, result, fields){
            res.send(result);
        })
})

//회원가입 요청(등록눌렀음)
app.post("/join", async (req, res)=> {
    //입력받은 비밀번호 mytextpass로 할당
    const mytextpass = req.body.m_pass;
    let myPass = "";
    const {m_name, m_pass, m_phone, m_nickname, m_add1, m_add2, m_email} = req.body;
    console.log(req.body)
    //빈문자열이 아니고 undefined가 아닐 때
    if(mytextpass != '' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash 메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여 콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {  //암호화 시킨게 hash  1234-> skdlfj123i$#
                myPass = hash;
                //쿼리 작성
                conn.query(`insert into member(m_name, m_pass, m_phone, m_nickname, m_address1, m_address2, m_email) values('${m_name}', '${myPass}', '${m_phone}', '${m_nickname}', '${m_add1}', '${m_add2}', '${m_email}')`
                ,(err, result, fields)=>{
                    if(result) {
                        res.send("등록되었습니다.")
                    }
                    console.log(err)
                })
            });
        });
    }
    // insert into member(m_name, m_pass, m_phone, m_nickname, m_add1, m_add2)
    //values(${})
    
})


app.listen(port, ()=>{
    console.log("서버가 동작하고 있습니다.")
})




