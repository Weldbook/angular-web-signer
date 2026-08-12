export interface Annotation {
  [propName: string]: any; // В дальнейшем расписать детально
}

export interface Annotations {
  annotations: Annotation[];
  change: boolean;
}


export let annotationsObject: Annotations = {
  annotations: [],
  change: false
}
