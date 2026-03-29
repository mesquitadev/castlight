import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { setScreens } from "../store/slices/screens";
import type { ServerToClientEvents, ClientToServerEvents } from "@castlight/shared";
import { SIDECAR_PORT, SIDECAR_WS_PATH } from "@castlight/shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SIDECAR_URL = `http://localhost:${SIDECAR_PORT}`;

export function useSocket(): TypedSocket | null {
  const socketRef = useRef<TypedSocket | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const socket: TypedSocket = io(SIDECAR_URL, {
      path: SIDECAR_WS_PATH,
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      console.log("[socket] connected to sidecar");
    });
    socket.on("screens:updated", (screens) => {
      dispatch(setScreens(screens));
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  return socketRef.current;
}
