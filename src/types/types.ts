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
    label?: string;
    isSource?: boolean | string;
    isSink?: boolean | string;
    isInPath?: boolean | string;
    pathFlow?: number;
    isBackwardEdge?: boolean | string;
    saturated?: boolean | string;
    blocked?: boolean | string;
  };
}