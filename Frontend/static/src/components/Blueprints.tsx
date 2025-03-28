import { useState, useRef, useCallback, useEffect } from "react";
import PolygonHandler from './PolygonHandler';
import Modal from "react-modal";
import {
  connectStomp,
  subscribeToNewPoints,
  sendPoint,
  disconnectStomp,
} from "./StompClient";
import "./Blueprints.css";

Modal.setAppElement("#root");

interface Point {
  x: number;
  y: number;
}

interface Blueprint {
  name: string;
  points: Point[];
  author: string;
}

const Blueprints = () => {
  const [author, setAuthor] = useState<string>("");
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(
    null
  );
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [updatedPoints, setUpdatedPoints] = useState<Point[]>([]);
  const [blueprintModified, setBlueprintModified] = useState<boolean>(false);
  const [isCreatingNewBlueprint, setIsCreatingNewBlueprint] =
    useState<boolean>(false);
  const [collaborativePoints, setCollaborativePoints] = useState<Point[]>([]);
  const canvasReference = useRef<HTMLCanvasElement | null>(null);
  const lastSentPoint = useRef<Point | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // scaleParams to store scaling parameters
  const scaleParams = useRef({
    minX: 0,
    minY: 0,
    scale: 1,
    margin: 10,
  });

  // Reset state when a new blueprint is selected
  useEffect(() => {
    if (selectedBlueprint) {
      setUpdatedPoints([...selectedBlueprint.points]);
      setCollaborativePoints([]);
      setBlueprintModified(false);
    } else {
      setCollaborativePoints([]); // Clear any points if no blueprint is selected
    }
  }, [selectedBlueprint]);

  const handleCanvasClick = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      const canvas = canvasReference.current;
      if (!canvas || !selectedBlueprint) return;

      let canvasX = 0,
        canvasY = 0;

      if (event.type === "click") {
        const rect = canvas.getBoundingClientRect();
        canvasX = (event as MouseEvent).clientX - rect.left;
        canvasY = (event as MouseEvent).clientY - rect.top;
      } else if (
        event.type === "touchstart" &&
        (event as TouchEvent).touches.length > 0
      ) {
        const touch = (event as TouchEvent).touches[0];
        const rect = canvas.getBoundingClientRect();
        canvasX = touch.clientX - rect.left;
        canvasY = touch.clientY - rect.top;
      }

      const { minX, minY, scale, margin } = scaleParams.current;

      const inverseTransform = (
        canvasCoord: number,
        min: number,
        scale: number
      ) => {
        if (isCreatingNewBlueprint) {
          return canvasCoord;
        }
        return (canvasCoord - margin) / scale + min;
      };

      const originalX = inverseTransform(canvasX, minX, scale);
      const originalY = inverseTransform(canvasY, minY, scale);

      const newPoint: Point = {
        x: parseFloat(originalX.toFixed(2)),
        y: parseFloat(originalY.toFixed(2)),
      };

      console.log(`Adding new point: x=${newPoint.x}, y=${newPoint.y}`);

      lastSentPoint.current = newPoint;

      // Add the point locally to collaborativePoints only if it doesn't already exist
      if (
        !collaborativePoints.some(
          (p) => p.x === newPoint.x && p.y === newPoint.y
        )
      ) {
        setCollaborativePoints((prevPoints) => [...prevPoints, newPoint]);
      }

      // Send the point to the dynamic topic
      await sendPoint(
        selectedBlueprint.author,
        selectedBlueprint.name,
        newPoint
      );
      setBlueprintModified(true);
    },
    [selectedBlueprint, isCreatingNewBlueprint, collaborativePoints]
  );

  // Function to draw the blueprint on the canvas
  const drawBlueprint = useCallback(
    (points: Point[]) => {
      const canvas = canvasReference.current;
      if (!canvas) return;

      const ctx: CanvasRenderingContext2D = canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

      // Always clear the canvas, even if there are no points
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Combine local and collaborative points
      const allPoints = [...points, ...collaborativePoints];

      // If there are no points, just return after clearing the canvas
      if (allPoints.length === 0) {
        // For new blueprints, reset scaling parameters
        if (isCreatingNewBlueprint) {
          scaleParams.current = {
            minX: 0,
            minY: 0,
            scale: 1,
            margin: 10,
          };
        }
        return;
      }

      // Calculate scaling
      const margin = 10;
      const Yvalues = allPoints.map((point) => point.y);
      const Xvalues = allPoints.map((point) => point.x);
      const maxY = Math.max(...Yvalues);
      const minY = Math.min(...Yvalues);
      const maxX = Math.max(...Xvalues);
      const minX = Math.min(...Xvalues);

      const scale = Math.min(
        (canvas.width - margin * 2) / (maxX - minX || 1),
        (canvas.height - margin * 2) / (maxY - minY || 1)
      );

      // Store scaling parameters
      scaleParams.current = {
        minX,
        minY,
        scale,
        margin,
      };

      // Transform coordinates to draw the blueprint
      const transcoord = (coord: number, min: number, scale: number) => {
        if (isCreatingNewBlueprint) {
          return coord;
        }
        return (coord - min) * scale + margin;
      };

      // Draw the blueprint
      ctx.beginPath();
      ctx.moveTo(
        transcoord(allPoints[0].x, minX, scale),
        transcoord(allPoints[0].y, minY, scale)
      );
      allPoints.slice(1).forEach((point) => {
        ctx.lineTo(
          transcoord(point.x, minX, scale),
          transcoord(point.y, minY, scale)
        );
      });
      ctx.strokeStyle = "#3498db";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the points
      allPoints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(
          transcoord(point.x, minX, scale),
          transcoord(point.y, minY, scale),
          3,
          0,
          2 * Math.PI
        );

        let fillColor = "#e74c3c";
        if (index === 0) {
          fillColor = "#2ecc71";
        } else if (index === allPoints.length - 1 && blueprintModified) {
          fillColor = "#3498db";
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
      });
    },
    [blueprintModified, isCreatingNewBlueprint, collaborativePoints]
  );

  // New function to handle creating a new blueprint
  const handleCreateNewBlueprint = useCallback(() => {
    const newBlueprintName = window.prompt(
      "Ingrese el nombre del nuevo blueprint:"
    );

    if (newBlueprintName) {
      // Set up state for new blueprint
      const newBlueprint = {
        name: newBlueprintName,
        author: author,
        points: [],
      };
      setSelectedBlueprint(newBlueprint);
      setUpdatedPoints([]);
      setCollaborativePoints([]);
      setBlueprintModified(false);
      setIsCreatingNewBlueprint(true);

      // Open the modal
      setModalIsOpen(true);
    }
  }, [author]);

  // useEffect to redraw the blueprint when points or selectedBlueprint changes
  useEffect(() => {
    // Always redraw, even if updatedPoints is empty, to handle new blueprints
    drawBlueprint(updatedPoints);
  }, [updatedPoints, collaborativePoints, drawBlueprint]);

  // Setup event listeners when the modal is opened
  const setupCanvasListeners = useCallback(() => {
    const canvas = canvasReference.current;
    if (!canvas) return;

    console.log("Adding event listeners to canvas");

    canvas.removeEventListener("click", handleCanvasClick);
    canvas.removeEventListener("touchstart", handleCanvasClick);

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("touchstart", handleCanvasClick);
  }, [handleCanvasClick]);

  // Cleanup event listeners when component unmounts or modal closes
  const cleanupCanvasListeners = useCallback(() => {
    const canvas = canvasReference.current;
    if (!canvas) return;

    console.log("Removing event listeners from canvas");
    canvas.removeEventListener("click", handleCanvasClick);
    canvas.removeEventListener("touchstart", handleCanvasClick);
  }, [handleCanvasClick]);

  // Effect to handle cleanup on unmount (only on component unmount)
  useEffect(() => {
    return () => {
      cleanupCanvasListeners();
      // Clean up WebSocket subscription and connection on component unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      disconnectStomp();
    };
  }, []); // Empty dependency array to ensure this only runs on unmount

  // Función para obtener los blueprints de un autor
  const handleGetBlueprints = async () => {
    console.log(`Obteniendo blueprints del autor: ${author}`);
    try {
      const response = await fetch(
        `http://localhost:8080/blueprints/${author}`
      );
      if (response.ok) {
        const data: Blueprint[] = await response.json();
        setBlueprints(data);
        setSelectedBlueprint(null);

        const total = data.reduce(
          (sum: number, blueprint: Blueprint) =>
            sum + (blueprint.points?.length || 0),
          0
        );
        setTotalPoints(total);

        setError(null);
      } else if (response.status === 404) {
        setBlueprints([]);
        setError("No se encontraron blueprints para el autor ingresado");
      }
    } catch (err: unknown) {
      console.error("Error obteniendo blueprints:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setBlueprints([]);
      setTotalPoints(0);
    }
  };

  // Function to save the updated blueprint
  const saveUpdatedBlueprint = useCallback(async () => {
    if (!selectedBlueprint || !blueprintModified) return;

    const isNewBlueprint = isCreatingNewBlueprint;
    const { author, name } = selectedBlueprint;

    const blueprintToSave = {
      author: author,
      name: name,
      points: [...updatedPoints, ...collaborativePoints],
    };

    try {
      let response;
      if (isNewBlueprint) {
        response = await fetch(`http://localhost:8080/blueprints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(blueprintToSave),
        });
      } else {
        response = await fetch(
          `http://localhost:8080/blueprints/${author}/${name}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(blueprintToSave),
          }
        );
      }

      if (!response.ok) {
        throw new Error("Error saving blueprint");
      }

      if (isNewBlueprint) {
        setBlueprints((prevBlueprints) => [...prevBlueprints, blueprintToSave]);
      } else {
        const updatedBlueprints = blueprints.map((bp) =>
          bp.name === name ? { ...bp, points: blueprintToSave.points } : bp
        );
        setBlueprints(updatedBlueprints);
      }

      setBlueprintModified(false);
      setIsCreatingNewBlueprint(false);
      setCollaborativePoints([]);

      handleGetBlueprints();
      setModalIsOpen(false);
    } catch (error) {
      console.error("Error saving blueprint:", error);
      setError("Error al guardar el blueprint");
    }
  }, [
    selectedBlueprint,
    blueprintModified,
    updatedPoints,
    collaborativePoints,
    blueprints,
    isCreatingNewBlueprint,
  ]);

  // Function to delete a blueprint
  const deleteBlueprint = useCallback(
    async (blueprint: Blueprint) => {
      if (!blueprint) return;

      const { author, name } = blueprint;

      try {
        const response = await fetch(
          `http://localhost:8080/blueprints/${author}/${name}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Error deleting blueprint");
        }

        const updatedBlueprints = blueprints.filter(
          (bp) => bp.name !== name || bp.author !== author
        );
        setBlueprints(updatedBlueprints);

        setSelectedBlueprint(null);
        handleGetBlueprints();
        setModalIsOpen(false);
      } catch (error) {
        console.error("Error deleting blueprint:", error);
        setError("Error al eliminar el blueprint");
      }
    },
    [blueprints]
  );

  const openModal = useCallback(async (blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint);
    setModalIsOpen(true);

    try {
      // Connect to WebSocket and subscribe to the dynamic topic
      await connectStomp();
      const unsubscribe = await subscribeToNewPoints(
        blueprint.author,
        blueprint.name,
        (point: Point) => {
          console.log("Received collaborative point:", point);

          // Prevent re-adding the same point
          if (
            lastSentPoint.current &&
            lastSentPoint.current.x === point.x &&
            lastSentPoint.current.y === point.y
          ) {
            console.log("Ignoring point sent by this client");
            lastSentPoint.current = null;
            return;
          }

          // Only add point if it's not a duplicate
          setCollaborativePoints((prevPoints) => [...prevPoints, point]);
        }
      );
      unsubscribeRef.current = unsubscribe;
      console.log(
        `Subscribed to /topic/newpoint/${blueprint.author}/${blueprint.name}`
      );
    } catch (error) {
      console.error("Failed to connect and subscribe:", error);
      setError("No se pudo conectar al servidor WebSocket");
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    cleanupCanvasListeners();

    // Clean up WebSocket subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (blueprintModified) {
      if (
        window.confirm("¿Desea guardar los cambios realizados al blueprint?")
      ) {
        saveUpdatedBlueprint();
      }
    }
  }, [cleanupCanvasListeners, blueprintModified, saveUpdatedBlueprint]);

  return (
    <div>
      <h1>Gestión de Blueprints</h1>

      <input
        type="text"
        placeholder="Ingrese el nombre del autor"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <button onClick={handleGetBlueprints}>Get Blueprints</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {author && (
        <button
          onClick={handleCreateNewBlueprint}
          style={{ marginLeft: "10px" }}
        >
          Crear
        </button>
      )}

      {blueprints.length > 0 && (
        <>
          <h2>Autor: {author}</h2>

          <table border={1}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puntos</th>
                <th>Plano</th>
              </tr>
            </thead>
            <tbody>
              {blueprints.map((bp) => (
                <tr key={bp.name}>
                  <td>{bp.name}</td>
                  <td>{bp.points.length}</td>
                  <td>
                    <button onClick={() => openModal(bp)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Total de puntos: {totalPoints}</h3>
        </>
      )}
      <div className="modal-container">
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Selected Blueprint"
          className="modal"
          overlayClassName="overlay"
          style={{
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              padding: "15px",
              borderRadius: "10px",
              maxWidth: "100%",
              maxHeight: "100%",
            },
          }}
          onAfterOpen={() => {
            if (selectedBlueprint) {
              setUpdatedPoints([...selectedBlueprint.points]);
              setTimeout(() => {
                drawBlueprint(selectedBlueprint.points);
                setupCanvasListeners();
              }, 0);
            }
          }}
        >
          <div className="modal-content">
            <h2>{selectedBlueprint?.name}</h2>
            <canvas
              ref={canvasReference}
              width={600}
              height={500}
              style={{
                border: "1px solid #000",
                zIndex: 10,
              }}
            ></canvas>
            {selectedBlueprint && (
              <PolygonHandler
                author={selectedBlueprint.author}
                blueprintName={selectedBlueprint.name}
                canvasRef={canvasReference}
              />
            )}
            <div
              className="buttons"
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <button
                  onClick={saveUpdatedBlueprint}
                  disabled={!blueprintModified}
                >
                  Guardar/Actualizar
                </button>
                <button onClick={() => deleteBlueprint(selectedBlueprint!)}>
                  Eliminar
                </button>
              </div>
              <button onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Blueprints;