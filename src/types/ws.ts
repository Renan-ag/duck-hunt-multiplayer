export type ServerMessage =
  | { type: "room-created"; roomId: string }
  | { type: "player-joined"; playerId: number }
  | { type: "player-left"; playerId: number }
  | { type: "input"; playerId: number; payload: PlayerInput }
  | { type: "joined-room"; playerId: number; rejoinToken: string }
  | { type: "error"; message: string }
  | { type: "rejoined-room"; playerId: number };

export type PlayerInput = {
  gamma?: number;
  beta?: number;
  shoot?: boolean;
};
