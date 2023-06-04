import './App.css';
import { useState } from 'react';
import { useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ReactHtmlParser from 'react-html-parser';
import Axios from 'axios';

function Login(props) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  
  return <>
    <h2>로그인</h2>

    <div className="form">
      <p><input className="login" type="text" name="username" placeholder="아이디" onChange={event => {
        setId(event.target.value);
      }} /></p>
      <p><input className="login" type="password" name="pwd" placeholder="비밀번호" onChange={event => {
        setPassword(event.target.value);
      }} /></p>

      <p><input className="btn" type="submit" value="로그인" onClick={() => {
        const userData = {
          userId: id,
          userPassword: password,
        };
        fetch("http://localhost:3001/login", { //auth 주소에서 받을 예정
          method: "post", // method :통신방법
          headers: {      // headers: API 응답에 대한 정보를 담음
            "content-type": "application/json",
          },
          body: JSON.stringify(userData), //userData라는 객체를 보냄
        })
          .then((res) => res.json())
          .then((json) => {            
            if(json.isLogin==="True"){
              props.setMode("WELCOME");
            }
            else {
              alert(json.isLogin)
            }
          });
      }} /></p>
    </div>

    <p>계정이 없으신가요?  <button onClick={() => {
      props.setMode("SIGNIN");
    }}>회원가입</button></p>
  </> 
}


function Signin(props) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  return <>
    <h2>회원가입</h2>

    <div className="form">
      <p><input className="login" type="text" placeholder="아이디" onChange={event => {
        setId(event.target.value);
      }} /></p>
      <p><input className="login" type="password" placeholder="비밀번호" onChange={event => {
        setPassword(event.target.value);
      }} /></p>
      <p><input className="login" type="password" placeholder="비밀번호 확인" onChange={event => {
        setPassword2(event.target.value);
      }} /></p>

      <p><input className="btn" type="submit" value="회원가입" onClick={() => {
        const userData = {
          userId: id,
          userPassword: password,
          userPassword2: password2,
        };
        fetch("http://localhost:3001/signin", { //signin 주소에서 받을 예정
          method: "post", // method :통신방법
          headers: {      // headers: API 응답에 대한 정보를 담음
            "content-type": "application/json",
          },
          body: JSON.stringify(userData), //userData라는 객체를 보냄
        })
          .then((res) => res.json())
          .then((json) => {
            if(json.isSuccess==="True"){
              alert('회원가입이 완료되었습니다!')
              props.setMode("LOGIN");
            }
            else{
              alert(json.isSuccess)
            }
          });
      }} /></p>
    </div>

    <p>로그인화면으로 돌아가기  <button onClick={() => {
      props.setMode("LOGIN");
    }}>로그인</button></p>
  </> 
}

function Board() {
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');


  const [movieContent, setMovieContent] = useState({
    title: '',
    content: '',
    image: ''
  })

  const [viewContent, setViewContent] = useState([]);

  useEffect(()=>{
    Axios.get('http://localhost:3001/api/get').then((response)=>{
      setViewContent(response.data);
    })
  },[viewContent])

  const submitReview = () => {
    const formData = new FormData();
    formData.append("image", image); // 이미지 데이터를 FormData에 추가

    Axios.post("http://localhost:3001/api/upload", formData)
      .then((response) => {
        // 이미지 업로드 후 반환된 파일 경로를 이용해 게시물 등록
        Axios.post("http://localhost:3001/api/insert", {
          title: movieContent.title,
          content: movieContent.content,
          image: response.data.filename // 반환된 파일 경로를 image 컬럼에 저장
        }).then(() => {
          alert("등록 완료!");
        });
      })
      .catch((error) => {
        console.error("이미지 업로드 오류:", error);
      });
  };
  const convertData = () => {
    Axios.post("http://localhost:3001/convert")
      .then((response) => {
        alert(response.data.message);
      })
      .catch((error) => {
        console.error("Convert 오류:", error);
      });
  };
  const getValue = e => {
    const { name, value } = e.target;
    setMovieContent({
      ...movieContent,
      [name]: value
    })
  };

   // (1)
    const [flag, setFlag] = useState(false);
    const imgLink = "http://localhost:3001/images/"

    const customUploadAdapter = (loader) => { // (2)
        return {
            upload(){
                return new Promise ((resolve, reject) => {
                    const data = new FormData();
                     loader.file.then( (file) => {
                            data.append("name", file.name);
                            data.append("file", file);

                            Axios.post('/api/upload', data)
                                .then((res) => {
                                    if(!flag){
                                        setFlag(true);
                                        setImage(res.data.filename);
                                    }
                                    resolve({
                                        default: `${imgLink}/${res.data.filename}`
                                    });
                                })
                                .catch((err)=>reject(err));
                        })
                })
            }
        }
    }

    function uploadPlugin (editor){ // (3)
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return customUploadAdapter(loader);
        }
    }

  return (
    <div className="App">
      <h1>게시판</h1>
      <div className='movie-container'>
        {viewContent.map(element =>
          <div style={{ border: '1px solid #333' }}>
            <h2>{element.title}</h2>
            <div>
              {ReactHtmlParser(element.content)}
            </div>
          </div>
        )}
      </div>
      <div className='form-wrapper'>
        <input className="title-input"
          type='text'
          placeholder='제목'
          onChange={getValue}
          name='title'
        />
        <CKEditor
          editor={ClassicEditor}
          config={{ // (4)
            extraPlugins: [uploadPlugin]
          }}
          data="<p>Hello from CKEditor 5!</p>"
          onReady={editor => {
            // You can store the "editor" and use when it is needed.
            console.log('Editor is ready to use!', editor);
          }}
          onChange={(event, editor) => {
            const data = editor.getData();
            console.log({ event, editor, data });
            setMovieContent({
              ...movieContent,
              content: data
            })
          }}
          onBlur={(event, editor) => {
            console.log('Blur.', editor);
          }}
          onFocus={(event, editor) => {
            console.log('Focus.', editor);
          }}
        />
      </div>
      <button className="convert-button" onClick={convertData}>
        변환하기
      </button>
      <button
        className="submit-button"
        onClick={submitReview}
        >입력</button>
    </div>
  );

}

function App(props) {
  const [mode, setMode] = useState("");
  // const [mode2, setMode2] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/authcheck")
      .then((res) => res.json())
      .then((json) => {        
        if (json.isLogin === "True") {
          setMode("WELCOME");
        }
        else {
          setMode("LOGIN");
        }
      });
  }, []); 

  let content = null;  

  if(mode==="LOGIN"){
    content = <Login setMode={setMode}></Login> 
  }
  else if (mode === 'SIGNIN') {
    content = <Signin setMode={setMode}></Signin> 
  }
  else if (mode === 'WELCOME') {
    content = <>
    {/* <h2>메인 페이지에 오신 것을 환영합니다</h2> */}
    {/* <p>로그인에 성공하셨습니다.</p>  */}
    <Board setMode={setMode}></Board>
    <p><a href="/logout">로그아웃</a></p> 
    {/* <Board setMode={setMode}></Board> */}
    {/* <a href="/board" onclick = {content = <Board setMode={setMode}></Board>}>게시판</a> */}
    </>
  }

  return (
    <>

      <div className="background">
        {content}
      </div>
    </>
  );
}

export default App;