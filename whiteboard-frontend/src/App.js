// App.js
import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { ChromePicker } from "react-color";
import "./App.css";

const socket = io("https://collaborative-whiteboard-9iid.onrender.com");

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const prevPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    // Socket listeners
    socket.on("draw", ({ x0, y0, x1, y1, color, brushSize }) => {
      drawLine(x0, y0, x1, y1, color, brushSize, false);
    });

    socket.on("clear", () => {
      clearCanvas();
    });

    return () => {
      socket.off("draw");
      socket.off("clear");
    };
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = isEraser ? "#ffffff" : color;
      ctxRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, isEraser]);

  const startDrawing = (e) => {
    setDrawing(true);
    prevPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const draw = (e) => {
    if (!drawing) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    drawLine(
      prevPos.current.x,
      prevPos.current.y,
      x,
      y,
      isEraser ? "#ffffff" : color,
      brushSize,
      true
    );

    prevPos.current = { x, y };
  };

  const drawLine = (x0, y0, x1, y1, strokeColor, strokeWidth, emit) => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socket.emit("draw", { x0, y0, x1, y1, color: strokeColor, brushSize: strokeWidth });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvas();
    socket.emit("clear");
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <button className="btn" onClick={() => setShowColorPicker(!showColorPicker)}>
          Choose Color
        </button>

        {showColorPicker && (
          <div className="color-picker-popup">
            <ChromePicker
              color={color}
              onChange={(updatedColor) => setColor(updatedColor.hex)}
              disableAlpha={true}
            />
          </div>
        )}

        <label>
          Brush Size:
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(e.target.value)}
          />
        </label>

        <button className="btn" onClick={() => setIsEraser(!isEraser)}>
          {isEraser ? "Disable Eraser" : "Eraser"}
        </button>

        <button className="btn" onClick={handleClear}>Clear Board</button>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
        />
      </div>
    </div>
  );
}

export default App;
