import { useRef, useEffect } from 'react';
import './Snow.css';

type Flake = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  windRadius: number;
};

const Snow = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    let mouseX = -1000;
    let mouseY = -1000;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    let animationId: number;

    const flakes: Flake[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 1.5 + 0.5,
      drift: (Math.random() - 0.5) * 0.5,
      windRadius: 500,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';

      flakes.forEach((flake) => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();

        // Ветер от мыши — ОТТАЛКИВАНИЕ
        if (mouseX !== -1000 && mouseY !== -1000) {
          const dx = flake.x - mouseX; // инвертируем: снежинка в минус от мыши
          const dy = flake.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < flake.windRadius) {
            const ratio = (flake.windRadius - dist) / flake.windRadius;
            // Слабый ветер отталкивания, только горизонтальное влияние
            const windForce = 0.4 * ratio;
            flake.x += (dx / Math.max(dist, 1)) * windForce;
          }
        }

        if (flake.x <= flake.size || flake.x >= width - flake.size) {
          flake.drift *= -1;
        }

        flake.y += flake.speed;
        flake.x += flake.drift;

        if (flake.y > height + 5) {
          flake.y = -5;
          flake.x = Math.random() * width;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="snow-canvas" />;
};

export default Snow;
