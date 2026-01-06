import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { Server as IOServerType } from "socket.io";
import { Server as IOServer } from "socket.io";
import type { NextApiResponse } from "next";

type SocketServer = HTTPServer & {
  io?: IOServerType;
};

type SocketResponse = NextApiResponse & {
  socket: NetSocket & {
    server: SocketServer;
  };
};

const SOCKET_PATH = "/api/socket";

export const initSocket = (res: SocketResponse) => {
  if (!res.socket?.server) return null;
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: SOCKET_PATH,
      addTrailingSlash: false,
    });
    io.on("connection", (socket) => {
      socket.on("join-task", (taskId: string) => {
        if (!taskId) return;
        socket.join(`task:${taskId}`);
      });
      socket.on("leave-task", (taskId: string) => {
        if (!taskId) return;
        socket.leave(`task:${taskId}`);
      });
    });
    res.socket.server.io = io;
    (globalThis as { __ipms_io__?: IOServerType }).__ipms_io__ = io;
  }
  return res.socket.server.io ?? null;
};

export const getSocketIO = () =>
  (globalThis as { __ipms_io__?: IOServerType }).__ipms_io__;
