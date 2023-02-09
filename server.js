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
const storage = multer.diskStorage({ //이미지 저장소(스토리지저장소)
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
app.post("/upload", upload.single("img"), (req,res)=>{
    //<input type=file name="img"/>위에꺼 풀이
    console.log("등록됨")
    res.send({
        imageUrl: req.file.filename
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
app.get('/specials/:limits', (req,res)=> {
    const {limits} =req.params
    conn.query(`select * from event where e_category = 'special' limit ${limits}`,
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

//객실 데이터 불러오기
app.get("/room", async (req, res)=>{
    conn.query(`select * from guestroom`, (err, result, fields)=> {
        console.log( result)
        res.send(result)
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

//로그인 요청
app.post("/login",async (req, res)=>{
    //useremail값에 일치하는 데이터가 있는지 확인
    //userpass암호화해서 쿼리 결과의 패스워드랑 일치하는지 체크
    const { useremail, userpass } = req.body;
    conn.query(`select * from member where m_email = '${useremail}'`, 
    (err, result, fields)=>{
        console.log(result)
        //결과가 undefiend가 아니고 결과의 0번째가 undefiend가 아닐때
        //결과가 있을 떄
        if(result != undefined && result[0] != undefined){ //result는 쿼리결과
            bcrypt.compare(userpass, result[0].m_pass, function(err, rese){ //rese는 암호화한 값 결과
                //result == true
                if(rese){
                    console.log("로그인 성공");
                    res.send(result)
                }else {
                    console.log("로그인 실패");
                    res.send("실패")
                }
            })//compare은 userpass를 암호화해서 result[0].mpass와 비교함 비교완료되면 오른쪽 함수 실행
            
        }else{
            console.log("데이터가 없습니다.");
        }
    })
})

//아이디 찾기 요청
app.post("/findid", async (req, res)=>{
    const {m_name, m_phone} = req.body;
    conn.query(`select * from member where m_name = '${m_name}' and m_phone = '${m_phone}'`, 
    (err,result, fields)=>{
        if(result) {
            console.log(result[0].m_email);
            res.send(result[0].m_email);
        }
        console.log(err)
    })
})

//비밀번호 찾기 요청
app.post("/findpass", async (req, res)=>{
    const {m_name, m_email} = req.body;
    conn.query(`select * from member where m_name = '${m_name}' and m_email = '${m_email}'`, 
    (err,result, fields)=>{
        if(result) {
            res.send(result[0].m_email);
        }
        console.log(err)
    })
})

//비밀번호 변경 요청
app.patch('/updatePw', async (req,res) => {
    const {m_pass, m_email } = req.body;
    //update 테이블 이름
    //set 필드이름= 데이터값
    //where 조건절 update member set m_pass
    const mytextpass = m_pass
    let myPass = ''
    if(mytextpass != '' && mytextpass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash 메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여 콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {  //암호화 시킨게 hash  1234-> skdlfj123i$#
                myPass = hash;
                //쿼리 작성
                conn.query(`update member set m_pass = '${myPass}' where m_email = '${m_email}'`  
                ,(err, result, fields)=>{
                    if(result) {
                        res.send("등록되었습니다.")
                        console.log(result)
                    }
                    console.log(err)
                })
            });
        });
    }
})

//이벤트 등록 요청
app.post('/event', async (req, res)=>{
    const {e_title, e_time, e_titledesc, e_desc, e_category, e_img1, e_img2} = req.body;
    //conn.query(`insert into 테이블이름(필드명.....) values(값...)`,콜백함수)
    //conn.query(`insert into 테이블이름(필드명.....) values(?,?,?,?,?,?)`,[e_title, e_desc...],콜백함수)
    conn.query(`insert into event(e_title, e_time, e_titledesc, e_desc, e_category, e_img1, e_img2) values(?,?,?,?,?,?,?)`,
    [e_title, e_time, e_titledesc, e_desc, e_category, e_img1, e_img2],(err, result, fields)=>{
        if(result){
            console.log(result)
            res.send("ok");
        }else{
            console.log(err);
        }
    })
})
//객실 등록 요청
app.post('/room', async (req, res)=>{
    const {r_name,r_size,r_price,r_bed,r_amenity,r_desc,r_img1,r_img2,r_img3,r_img4} = req.body
    conn.query(`insert into guestroom(r_name, r_size ,r_price ,r_bed ,r_amenity ,r_desc ,r_img1 ,r_img2 ,r_img3 ,r_img4) values(?,?,?,?,?,?,?,?,?,?)`,
    [r_name,r_size,r_price,r_bed,r_amenity,r_desc,r_img1,r_img2,r_img3,r_img4], (err, result, fields)=>{
        if(result){
            res.send("ok")
        }else {
            console.log(err);
        }
    })
})


app.listen(port, ()=>{
    console.log("서버가 동작하고 있습니다.")
})




