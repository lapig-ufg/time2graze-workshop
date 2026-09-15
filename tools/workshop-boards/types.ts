export type NoteColor = 'blue' | 'yellow' | 'salmon' | 'pink' | 'green';
export type BoardNote = {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  group?: string;
  label?: boolean;
};
export type WorkshopBoard = {
  id: string;
  title: string;
  facilitator: string;
  notes: BoardNote[];
  themes?: string[];
};
