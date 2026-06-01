import React, { useRef, useEffect } from 'react';

/**
 * Lightweight canvas-based chart component.
 * Supports 'line' and 'bar' chart types.
 */
export default function Chart({ type = 'bar', data = [], labels = [], width = 400, height = 200, color = '#06b6d4' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 30, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data, 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    if (type === 'bar') {
      const barWidth = Math.max(8, (chartW / data.length) * 0.6);
      const gap = chartW / data.length;

      data.forEach((val, i) => {
        const x = padding.left + gap * i + (gap - barWidth) / 2;
        const barH = (val / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        // Gradient fill
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '33');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
        ctx.fill();

        // Label
        if (labels[i]) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x + barWidth / 2, height - 8);
        }
      });
    } else if (type === 'line') {
      const stepX = chartW / Math.max(data.length - 1, 1);

      // Area fill
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = padding.left + stepX * i;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + stepX * (data.length - 1), padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      areaGrad.addColorStop(0, color + '30');
      areaGrad.addColorStop(1, color + '05');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      data.forEach((val, i) => {
        const x = padding.left + stepX * i;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots
      data.forEach((val, i) => {
        const x = padding.left + stepX * i;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0a0e1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Labels
      labels.forEach((label, i) => {
        if (!label) return;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, padding.left + stepX * i, height - 8);
      });
    }
  }, [type, data, labels, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  );
}
