export interface Comment {
  user: string;
  valueComment: string;
  date: string;
  name: string;
}

export interface Comments {
  [id: string]: Comment[];
}

export let comments: Comments = {};

