import { useState, useRef, useCallback, useEffect } from "react";
import Modal from "react-modal";
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
  const canvasReference = useRef<HTMLCanvasElement | null>(null);

  // scaleParams to store scaling parameters
  const scaleParams = useRef({
    minX: 0,
    minY: 0,
    scale: 1,
    margin: 10,
  });

  // Reset state when modal is opened with a new blueprint
  useEffect(() => {
    if (selectedBlueprint) {
      setUpdatedPoints([...selectedBlueprint.points]);
      setBlueprintModified(false);
    }
  }, [selectedBlueprint]);

  const handleCanvasClick = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const canvas = canvasReference.current;
      if (!canvas || !selectedBlueprint) return;

      let canvasX = 0,
        canvasY = 0;

      // Detect mouse click or touch event
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

      // Handle new blueprint creation with different scaling
      const { minX, minY, scale, margin } = scaleParams.current;

      // Function to transform coordinates
      const inverseTransform = (
        canvasCoord: number,
        min: number,
        scale: number
      ) => {
        // For new blueprints, use absolute coordinates
        if (isCreatingNewBlueprint) {
          return canvasCoord;
        }
        return (canvasCoord - margin) / scale + min;
      };

      const originalX = inverseTransform(canvasX, minX, scale);
      const originalY = inverseTransform(canvasY, minY, scale);

      // Create a new point with the coordinates
      const newPoint: Point = {
        x: parseFloat(originalX.toFixed(2)),
        y: parseFloat(originalY.toFixed(2)),
      };

      console.log(`Adding new point: x=${newPoint.x}, y=${newPoint.y}`);

      // Add the new point to the updated points
      setUpdatedPoints((prevPoints) => [...prevPoints, newPoint]);
      setBlueprintModified(true);
    },
    [selectedBlueprint, isCreatingNewBlueprint]
  );

  // Function to draw the blueprint on the canvas
  const drawBlueprint = useCallback(
    (points: Point[]) => {
      const canvas = canvasReference.current;
      if (!canvas || points.length === 0) return;

      const ctx: CanvasRenderingContext2D = canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling
      const margin = 10;
      const Yvalues = points.map((point) => point.y);
      const Xvalues = points.map((point) => point.x);
      const maxY = Math.max(...Yvalues);
      const minY = Math.min(...Yvalues);
      const maxX = Math.max(...Xvalues);
      const minX = Math.min(...Xvalues);

      // Special handling for new blueprint with no points
      if (isCreatingNewBlueprint && points.length === 0) {
        scaleParams.current = {
          minX: 0,
          minY: 0,
          scale: 1,
          margin: 10,
        };
        return;
      }

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
        // For new blueprints, use absolute coordinates
        if (isCreatingNewBlueprint) {
          return coord;
        }
        return (coord - min) * scale + margin;
      };

      // Draw the blueprint
      ctx.beginPath();
      ctx.moveTo(
        transcoord(points[0].x, minX, scale),
        transcoord(points[0].y, minY, scale)
      );
      points.slice(1).forEach((point) => {
        ctx.lineTo(
          transcoord(point.x, minX, scale),
          transcoord(point.y, minY, scale)
        );
      });
      ctx.strokeStyle = "#3498db";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the points
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(
          transcoord(point.x, minX, scale),
          transcoord(point.y, minY, scale),
          3,
          0,
          2 * Math.PI
        );

        // Color the points
        let fillColor = "#e74c3c"; // Default red
        if (index === 0) {
          fillColor = "#2ecc71"; // First point green
        } else if (index === points.length - 1 && blueprintModified) {
          fillColor = "#3498db"; // Last point blue if recently added
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
      });
    },
    [blueprintModified, isCreatingNewBlueprint]
  );

  // New function to handle creating a new blueprint
  const handleCreateNewBlueprint = useCallback(() => {
    // Prompt for blueprint name
    const newBlueprintName = window.prompt(
      "Ingrese el nombre del nuevo blueprint:"
    );

    if (newBlueprintName) {
      // Clear the canvas and reset points
      const canvas = canvasReference.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Set up state for new blueprint
      setSelectedBlueprint({
        name: newBlueprintName,
        author: author,
        points: [],
      });
      setUpdatedPoints([]);
      setBlueprintModified(false);
      setIsCreatingNewBlueprint(true);

      // Open the modal
      setModalIsOpen(true);
    }
  }, [author]);

  // useEffect to redraw the blueprint when points are updated
  useEffect(() => {
    if (updatedPoints.length > 0) {
      drawBlueprint(updatedPoints);
    }
  }, [updatedPoints, drawBlueprint]);

  // Setup event listeners when the modal is opened
  const setupCanvasListeners = useCallback(() => {
    const canvas = canvasReference.current;
    if (!canvas) return;

    console.log("Adding event listeners to canvas");

    // Remove any existing listeners first to prevent duplicates
    canvas.removeEventListener("click", handleCanvasClick);
    canvas.removeEventListener("touchstart", handleCanvasClick);

    // Add the listeners
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

  // Effect to handle cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCanvasListeners();
    };
  }, [cleanupCanvasListeners]);

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

    // Determine if this is a new blueprint or an update
    const isNewBlueprint = isCreatingNewBlueprint;
    const { author, name } = selectedBlueprint;

    const blueprintToSave = {
      author: author,
      name: name,
      points: updatedPoints,
    };

    try {
      let response;
      if (isNewBlueprint) {
        // POST request for new blueprint
        response = await fetch(`http://localhost:8080/blueprints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(blueprintToSave),
        });
      } else {
        // PUT request for existing blueprint
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

      // Update local state
      if (isNewBlueprint) {
        // Add the new blueprint to the list
        setBlueprints((prevBlueprints) => [...prevBlueprints, blueprintToSave]);
      } else {
        // Update existing blueprint
        const updatedBlueprints = blueprints.map((bp) =>
          bp.name === name ? { ...bp, points: updatedPoints } : bp
        );
        setBlueprints(updatedBlueprints);
      }

      // Reset state
      setBlueprintModified(false);
      setIsCreatingNewBlueprint(false);

      handleGetBlueprints();

      // Close the modal
      setModalIsOpen(false);
    } catch (error) {
      console.error("Error saving blueprint:", error);
      setError("Error al guardar el blueprint");
    }
  }, [
    selectedBlueprint,
    blueprintModified,
    updatedPoints,
    blueprints,
    totalPoints,
    isCreatingNewBlueprint,
  ]);

  //Function to delete a blueprint
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

        // Update local state
        const updatedBlueprints = blueprints.filter(
          (bp) => bp.name !== name || bp.author !== author
        );
        setBlueprints(updatedBlueprints);

        // Reset selected blueprint
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

  // Función para deshacer el último punto añadido
  const undoLastPoint = useCallback(() => {
    if (updatedPoints.length <= 1 || !selectedBlueprint) return;

    if (updatedPoints.length <= selectedBlueprint.points.length) {
      // No hay puntos añadidos para deshacer
      return;
    }

    const newPoints = updatedPoints.slice(0, -1);
    setUpdatedPoints(newPoints);
    setBlueprintModified(newPoints.length !== selectedBlueprint.points.length);

    // Redibujar el blueprint
    drawBlueprint(newPoints);
  }, [updatedPoints, selectedBlueprint, drawBlueprint]);

  const openModal = useCallback((blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint);
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    cleanupCanvasListeners();
    // Ask to save changes if blueprint is modified
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

      {/* Campo para capturar el autor */}
      <input
        type="text"
        placeholder="Ingrese el nombre del autor"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <button onClick={handleGetBlueprints}>Get Blueprints</button>

      {/* Mostrar error si existe */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* New 'Crear' button, only enabled when an author is selected */}
      {author && (
        <button
          onClick={handleCreateNewBlueprint}
          style={{ marginLeft: "10px" }}
        >
          Crear
        </button>
      )}

      {/* Mostrar nombre del autor seleccionado */}
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
              // Inicializar updatedPoints con los puntos del blueprint
              setUpdatedPoints([...selectedBlueprint.points]);
              // Dibujar el blueprint usando la función separada
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
                zIndex: 10, // Ensure the canvas is on top
              }}
            ></canvas>
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
                  onClick={undoLastPoint}
                  disabled={!blueprintModified}
                  style={{ marginRight: "10px" }}
                >
                  Deshacer último punto
                </button>
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
