"use client";

import { useRef, useEffect } from "react";

interface WaveformProps {
  getFrequencyData: (() => Uint8Array) | null;
  isActive: boolean;
  color?: string;
}

export default function Waveform({
  getFrequencyData,
  isActive,
  color = "#6366f1",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (!isActive || !getFrequencyData) {
        // idle state: flat line
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 1;
        ctx.stroke();
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const data = getFrequencyData();
      const barCount = 48;
      const gap = 3;
      const barWidth = (w - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length);
        const value = data[dataIndex] / 255;
        const barHeight = Math.max(2, value * h * 0.8);
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4 + value * 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, getFrequencyData, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20 rounded-lg"
      style={{ background: "transparent" }}
    />
  );
}
