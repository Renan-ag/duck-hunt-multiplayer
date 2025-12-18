export type ServerMessage =
  | { type: "room-created"; sessionId: string }
  | { type: "player-joined"; playerId: number }
  | { type: "input"; playerId: number; payload: PlayerInput }
  | { type: "joined-room"; playerId: number }
  | { type: "error"; message: string };

export type PlayerInput = {
  gamma?: number;
  beta?: number;
  shoot?: boolean;
};
