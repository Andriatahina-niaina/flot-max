export type Node = string;
export type Edge = [Node, Node];
export type Capacity = number;


export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  capacities: Capacity[];
}

export interface FlowGraphElement {
  data: {
    id: string;
    source?: Node;
    target?: Node;
    capacity?: Capacity;
  };
}