import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";



const socketUrl = "http://localhost:8080/ws";

const stompClient = new Client({
  webSocketFactory: () => new SockJS(socketUrl),
  reconnectDelay: 5000,
  debug: (str) => console.log(str),
  onConnect: () => {
    console.log("STOMP client connected");
  },
  onDisconnect: () => {
    console.log("STOMP client disconnected");
  },
  onStompError: (frame) => {
    console.error("STOMP error:", frame);
  },
});

// Helper function to wait for the STOMP client to connect
const waitForConnection = () => {
  return new Promise<void>((resolve, reject) => {
    if (stompClient.connected) {
      resolve();
    } else {
      stompClient.onConnect = () => {
        console.log("STOMP client connected");
        resolve();
      };
      stompClient.onStompError = (frame) => {
        console.error("STOMP connection error:", frame);
        reject(new Error("Failed to connect to STOMP: " + frame));
      };
    }
  });
};

export const connectStomp = async () => {
  return new Promise<void>((resolve, reject) => {
    if (stompClient.connected) {
      console.log("STOMP client is already connected");
      resolve();
      return;
    }

    console.log("Activating STOMP client...");
    stompClient.onConnect = () => {
      console.log("STOMP client connected");
      resolve();
    };

    stompClient.onStompError = (frame) => {
      console.error("STOMP connection error:", frame);
      reject(new Error("Failed to connect to STOMP: " + frame));
    };

    stompClient.activate();
  });
};

export const subscribeToNewPoints = async (
  author: string,
  name: string,
  callback: (point: { x: number; y: number }) => void
) => {
  let subscription: { unsubscribe: () => void } | null = null;

  const topic = `/topic/newpoint/${author}/${name}`;
  console.log(`Attempting to subscribe to ${topic}`);

  // Ensure the STOMP client is connected before subscribing
  if (!stompClient.connected) {
    await connectStomp();
  }

  // Now that the client is connected, subscribe
  if (stompClient.connected && !subscription) {
    subscription = stompClient.subscribe(topic, (message: IMessage) => {
      console.log(`Received message on ${topic}:`, message.body);
      try {
        const point = JSON.parse(message.body);
        if (point.x !== undefined && point.y !== undefined) {
          callback(point);
        } else {
          console.warn("Invalid point received:", point);
        }
      } catch (error) {
        console.error("Error parsing message body:", error);
      }
    });
    console.log(`Successfully subscribed to ${topic}`);
  } else {
    console.warn(
      "Cannot subscribe: STOMP client not connected or subscription already exists"
    );
  }

  return () => {
    if (subscription) {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${topic}`);
      subscription = null;
    }
  };
};

export const sendPoint = async (
  author: string,
  name: string,
  point: { x: number; y: number }
) => {
  const destination = `/app/newpoint/${author}/${name}`;
  if (!stompClient.connected) {
    await connectStomp();
  }
  if (stompClient.connected) {
    stompClient.publish({
      destination,
      body: JSON.stringify(point),
    });
    console.log(`Sent point to ${destination}:`, point);
  } else {
    console.error("STOMP client failed to connect, cannot send point:", point);
  }
};

export const subscribeToNewPolygons = async (
  author: string,
  blueprintName: string,
  callback: (points: { x: number; y: number }[]) => void
): Promise<() => void> => {
  try {
    await connectStomp(); 

    if (!stompClient.connected) {
      throw new Error("STOMP client is not connected after attempting to connect.");
    }

    const topic = `/topic/newpolygon/${author}/${blueprintName}`;
    console.log(`Subscribing to polygon topic: ${topic}`);

    const subscription = stompClient.subscribe(topic, (message: IMessage) => {
      try {
        const points = JSON.parse(message.body) as { x: number; y: number }[];
        console.log(`Received polygon with ${points.length} points`);
        callback(points);
      } catch (error) {
        console.error("Error parsing polygon points:", error);
      }
    });

    return () => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from polygon topic: ${topic}`);
    };
  } catch (error) {
    console.error("Error setting up polygon subscription:", error);
    return () => {};
  }
};


export const disconnectStomp = () => {
  if (stompClient.active) {
    stompClient.deactivate();
    console.log("STOMP client deactivated");
  }
};

export default stompClient;