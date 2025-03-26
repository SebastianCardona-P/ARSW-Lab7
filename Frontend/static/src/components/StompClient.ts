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

export const connectStomp = () => {
  if (!stompClient.active) {
    stompClient.activate();
  } else {
    console.log("STOMP client is already active");
  }
};

export const subscribeToNewPoints = (
  callback: (point: { x: number; y: number }) => void
) => {
  let subscription: { unsubscribe: () => void } | null = null;

  const subscribe = () => {
    if (stompClient.connected && !subscription) {
      subscription = stompClient.subscribe(
        "/topic/newpoint",
        (message: IMessage) => {
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
        }
      );
      console.log("Subscribed to /topic/newpoint");
    }
  };

  if (stompClient.connected) {
    subscribe();
  } else {
    stompClient.onConnect = () => {
      console.log("STOMP client connected, subscribing to /topic/newpoint");
      subscribe();
    };
    console.warn("STOMP client not connected, will subscribe after connection");
  }

  // Return cleanup function
  return () => {
    if (subscription) {
      subscription.unsubscribe();
      console.log("Unsubscribed from /topic/newpoint");
      subscription = null;
    }
  };
};

export const sendPoint = (point: { x: number; y: number }) => {
  if (stompClient.connected) {
    stompClient.publish({
      destination: "/app/newpoint",
      body: JSON.stringify(point),
    });
  } else {
    console.warn("STOMP client not connected, will send after connection");
    stompClient.onConnect = () => {
      console.log("STOMP client connected, sending point:", point);
      stompClient.publish({
        destination: "/app/newpoint",
        body: JSON.stringify(point),
      });
    };
  }
};

export const disconnectStomp = () => {
  if (stompClient.active) {
    stompClient.deactivate();
    console.log("STOMP client deactivated");
  }
};

export default stompClient;
