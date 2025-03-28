import { useEffect, RefObject } from "react";
import { subscribeToNewPolygons } from "./StompClient";

interface PolygonHandlerProps {
  author: string;
  blueprintName: string;
  canvasRef: RefObject<HTMLCanvasElement>;
}

const PolygonHandler = ({ author, blueprintName, canvasRef }: PolygonHandlerProps) => {
  useEffect(() => {
    if (!canvasRef.current) return;

    let unsubscribe: (() => void) | null = null;

    const handleNewPolygon = (points: { x: number; y: number }[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Limpiar canvas antes de dibujar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const margin = 10;
      const Yvalues = points.map((point) => point.y);
      const Xvalues = points.map((point) => point.x);
      const maxY = Math.max(...Yvalues);
      const minY = Math.min(...Yvalues);
      const maxX = Math.max(...Xvalues);
      const minX = Math.min(...Xvalues);

      const scale = Math.min(
        (canvas.width - margin * 2) / (maxX - minX || 1),
        (canvas.height - margin * 2) / (maxY - minY || 1)
      );

      const transformCoord = (coord: number, min: number) => {
        return (coord - min) * scale + margin;
      };

      // Dibujar polígono
      ctx.beginPath();
      ctx.moveTo(
        transformCoord(points[0].x, minX),
        transformCoord(points[0].y, minY)
      );

      points.slice(1).forEach((point) => {
        ctx.lineTo(
          transformCoord(point.x, minX),
          transformCoord(point.y, minY)
        );
      });

      ctx.closePath();
      ctx.strokeStyle = "#9b59b6";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(155, 89, 182, 0.2)";
      ctx.fill();
    };

    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToNewPolygons(author, blueprintName, handleNewPolygon);
      } catch (error) {
        console.error("Error setting up polygon subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [author, blueprintName, canvasRef]);

  return null;
};

export default PolygonHandler;