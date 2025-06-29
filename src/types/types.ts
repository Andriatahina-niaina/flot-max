// types/types.ts
export interface GraphData {
  nodes: string[];
  edges: [string, string][];
  capacities: number[];
  source: string;
  sink: string;
}

export interface FlowGraphElement {
  data: {
    id: string;
    source?: string;
    target?: string;
    capacity?: number;
    flow?: number;
    label?: string; // Nouvelle propriété
    isSource?: boolean;
    isSink?: boolean;
    isInPath?: boolean;
    pathFlow?: number;
    isBackwardEdge?: boolean;
  };
}