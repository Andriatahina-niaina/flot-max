// types/types.ts
export interface GraphData {
  nodes: string[];
  edges: [string, string][];
  capacities: number[];
  source: string;
  sink: string;
}

export interface MaxFlowResult {
  maxFlow: number;
  steps: FlowStep[];
  iterations: number;
  finalGraph: FlowGraphElement[]
}

export interface FlowStep {
  flows: number[];
  pathFlow: number;
  path: string[];
  description: string;
  elements?: FlowGraphElement[]
  residualMatrix: { [key: string]: { [key: string]: number } };
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