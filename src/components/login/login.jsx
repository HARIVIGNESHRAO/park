import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

const Login = () => {
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRepeatPassword, setRegRepeatPassword] = useState("");
  const loginButtonRef = useRef(null);
  const shapeRef = useRef(null);
  const overboxRef = useRef(null);
  const navigate = useNavigate();

  const handleFocus = (e) => {
    const inputParent = e.target.parentElement;
    const label = inputParent.querySelector("label");
    const spin = inputParent.querySelector(".spin");
    if (label && spin) {
      label.style.lineHeight = "18px";
      label.style.fontSize = "18px";
      label.style.fontWeight = "100";
      label.style.top = "0px";
      spin.style.width = "100%";
    }
  };

  const handleBlur = (e) => {
    const inputParent = e.target.parentElement;
    const label = inputParent.querySelector("label");
    const spin = inputParent.querySelector(".spin");
    if (label && spin) {
      spin.style.width = "0px";
      if (!e.target.value) {
        label.style.lineHeight = "60px";
        label.style.fontSize = "24px";
        label.style.fontWeight = "300";
        label.style.top = "10px";
      }
    }
  };

  const handleButtonClick = async (e, isLogin = true) => {
    console.log("Button clicked, isLogin:", isLogin);
    const button = isLogin ? loginButtonRef.current : e.currentTarget;
    const rect = button.getBoundingClientRect();
    const pX = e.clientX - rect.left;
    const pY = e.clientY - rect.top;

    const span = document.createElement("span");
    span.className = "click-efect";
    span.style.marginLeft = `${pX}px`;
    span.style.marginTop = `${pY}px`;
    button.appendChild(span);

    span.animate(
      {
        width: ["0px", "500px"],
        height: ["0px", "500px"],
        top: ["0px", "-250px"],
        left: ["0px", "-250px"],
      },
      { duration: 600, fill: "forwards" }
    );

    button.classList.add("active");
    setTimeout(() => {
      span.remove();
      button.classList.remove("active");
    }, 600);

    try {
      if (isLogin) {
        const response = await axios.post("http://localhost:5001/login", {
          username: loginUsername,
          password: loginPassword,
        });
        localStorage.setItem("username", loginUsername);
        alert(response.data.message);
        navigate("/home");
      } else {
        if (regPassword !== regRepeatPassword) {
          alert("Passwords do not match");
          return;
        }
        const response = await axios.post("http://localhost:5001/register", {
          username: regUsername,
          password: regPassword,
        });
        localStorage.setItem("username", regUsername);
        alert(response.data.message);
        navigate("/home");
      }
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred");
    }
  };

  const toggleForm = () => {
    const shape = shapeRef.current;
    const overbox = overboxRef.current;

    if (isLoginActive) {
      setIsLoginActive(false);
      setTimeout(() => {
        shape.style.width = "50%";
        shape.style.height = "50%";
        shape.style.transform = "rotate(45deg)";
        overbox.style.overflow = "hidden";
        overbox.querySelectorAll(".title, .input, .button").forEach((el) => {
          el.style.display = "block";
          el.style.opacity = "1";
        });
      }, 200);
    } else {
      shape.style.width = "100%";
      shape.style.height = "100%";
      shape.style.transform = "rotate(0deg)";
      overbox.querySelectorAll(".title, .input, .button").forEach((el) => {
        el.style.opacity = "0";
      });
      setTimeout(() => {
        overbox.style.overflow = "initial";
        setIsLoginActive(true);
      }, 600);
    }
  };

  return (
    <div className="materialContainer">
      <div className={`box ${!isLoginActive ? "back" : ""}`}>
        <div className="title">LOGIN</div>
        <div className="input">
          <label htmlFor="name">Username</label>
          <input
            type="text"
            name="name"
            id="name"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="spin"></span>
        </div>
        <div className="input">
          <label htmlFor="pass">Password</label>
          <input
            type="password"
            name="pass"
            id="pass"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="spin"></span>
        </div>
        <div className="button login">
          <button ref={loginButtonRef} onClick={(e) => handleButtonClick(e, true)}>
            <span>GO</span>
            <i className="fas fa-check"></i>
          </button>
        </div>
        <a href="#" className="pass-forgot">
          Forgot your password?
        </a>
      </div>

      <div className="overbox" ref={overboxRef}>
        <div
          className={`material-button alt-2 ${!isLoginActive ? "active" : ""}`}
          onClick={toggleForm}
        >
          <span className="shape" ref={shapeRef}></span>
        </div>
        <div className="title">REGISTER</div>
        <div className="input">
          <label htmlFor="regname">Username</label>
          <input
            type="text"
            name="regname"
            id="regname"
            value={regUsername}
            onChange={(e) => setRegUsername(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="spin"></span>
        </div>
        <div className="input">
          <label htmlFor="regpass">Password</label>
          <input
            type="password"
            name="regpass"
            id="regpass"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="spin"></span>
        </div>
        <div className="input">
          <label htmlFor="reregpass">Repeat Password</label>
          <input
            type="password"
            name="reregpass"
            id="reregpass"
            value={regRepeatPassword}
            onChange={(e) => setRegRepeatPassword(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <span className="spin"></span>
        </div>
        <div className="button">
          <button onClick={(e) => handleButtonClick(e, false)}>
            <span>NEXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;