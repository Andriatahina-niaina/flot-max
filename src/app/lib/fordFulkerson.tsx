import { FlowGraphElement, FlowStep, MaxFlowResult } from "../../types/types";

export const calculateMaxFlow = (
  nodes: string[],
  edges: [string, string][],
  initialCapacities: number[],
  source: string,
  sink: string
): MaxFlowResult => {
  const capacities = [...initialCapacities];
  const flows = new Array(edges.length).fill(0);
  const steps: FlowStep[] = [];
  let maxFlow = 0;

  // État initial
  steps.push({
    flows: [...flows],
    pathFlow: 0,
    path: [],
    description: "État initial : Aucun flot n'a encore été envoyé",
    residualMatrix: createResidualMatrix(nodes, edges, capacities, flows),
  });

  let iterationCount = 0;
  const MAX_ITERATIONS = 100;

  while (iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    // Trouver tous les chemins possibles
    const allPaths = findAllPaths(nodes, edges, capacities, flows, source, sink);
    if (allPaths.length === 0) break;

    // Trouver le chemin avec la capacité minimale
    const { path, minCapacity } = findPathWithMinCapacity(allPaths, edges, capacities, flows);
    if (minCapacity === 0) break;

    // Mettre à jour les flots
    updateFlowsForPath(path, edges, flows, capacities, minCapacity);
    maxFlow += minCapacity;

    // Enregistrer l'étape
    steps.push({
      elements: generateFlowElements(nodes, edges, capacities, flows, source, sink, path),
      pathFlow: minCapacity,
      path: path,
      description: `Étape ${iterationCount} : Chemin ${path.join(" → ")} avec capacité minimale ${minCapacity}`,
      flows: [...flows],
      residualMatrix: createResidualMatrix(nodes, edges, capacities, flows),
    });
  }

  // État final
  steps.push({
    elements: generateFlowElements(nodes, edges, capacities, flows, source, sink),
    pathFlow: maxFlow,
    path: [],
    description: `État final : Flot maximum de ${maxFlow} atteint après ${iterationCount} itérations`,
    flows: [...flows],
    residualMatrix: createResidualMatrix(nodes, edges, capacities, flows),
  });

  return {
    maxFlow,
    steps,
    iterations: iterationCount,
    finalGraph: generateFlowElements(nodes, edges, capacities, flows, source, sink)
  };
};

// Fonctions utilitaires
function findAllPaths(
  nodes: string[],
  edges: [string, string][],
  capacities: number[],
  flows: number[],
  source: string,
  sink: string
): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(current: string, path: string[]) {
    if (current === sink) {
      paths.push([...path]);
      return;
    }

    visited.add(current);

    edges.forEach(([u, v], index) => {
      if (u === current && !visited.has(v)) {
        const residual = capacities[index] - flows[index];
        if (residual > 0) {
          path.push(v);
          dfs(v, path);
          path.pop();
        }
      }
    });

    visited.delete(current);
  }

  dfs(source, [source]);
  return paths;
}

function findPathWithMinCapacity(
  paths: string[][],
  edges: [string, string][],
  capacities: number[],
  flows: number[]
): { path: string[]; minCapacity: number } {
  let minPath: string[] = [];
  let minCapacity = Infinity;

  for (const path of paths) {
    let currentMin = Infinity;

    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const edgeIndex = edges.findIndex(([from, to]) => from === u && to === v);
      if (edgeIndex === -1) continue;

      const residual = capacities[edgeIndex] - flows[edgeIndex];
      currentMin = Math.min(currentMin, residual);
    }

    if (currentMin < minCapacity) {
      minCapacity = currentMin;
      minPath = path;
    }
  }

  return { path: minPath, minCapacity };
}

function updateFlowsForPath(
  path: string[],
  edges: [string, string][],
  flows: number[],
  capacities: number[],
  flowToAdd: number
) {
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edgeIndex = edges.findIndex(([from, to]) => from === u && to === v);
    if (edgeIndex !== -1) {
      flows[edgeIndex] += flowToAdd;
    }
  }
}

function createResidualMatrix(
  nodes: string[],
  edges: [string, string][],
  capacities: number[],
  flows: number[]
): { [key: string]: { [key: string]: number } } {
  const matrix: { [key: string]: { [key: string]: number } } = {};

  nodes.forEach(node1 => {
    matrix[node1] = {};
    nodes.forEach(node2 => {
      if (node1 !== node2) {
        matrix[node1][node2] = 0;
      }
    });
  });

  edges.forEach(([from, to], index) => {
    const residual = capacities[index] - flows[index];
    matrix[from][to] = Math.max(0, residual);
  });

  return matrix;
}

function generateInitialElements(
  nodes: string[],
  edges: [string, string][],
  capacities: number[],
  flows: number[],
  source: string,
  sink: string
): FlowGraphElement[] {
  const elements: FlowGraphElement[] = [];

  nodes.forEach(node => {
    elements.push({
      data: {
        id: node,
        isSource: node === source,
        isSink: node === sink,
        isInPath: false,
      },
    });
  });

  edges.forEach(([u, v], index) => {
    elements.push({
      data: {
        id: `${u}-${v}-${index}`,
        source: u,
        target: v,
        capacity: capacities[index],
        flow: flows[index],
        label: `${flows[index]}/${capacities[index]}`,
        isInPath: "false",
        isBackwardEdge: "false",
        saturated: flows[index] === capacities[index] ? "true" : "false",
        blocked: capacities[index] === 0 ? "true" : "false",
      },
    });
  });

  return elements;
}

function generateFlowElements(
  nodes: string[],
  edges: [string, string][],
  capacities: number[],
  flows: number[],
  source: string,
  sink: string,
  currentPath: string[] = []
): FlowGraphElement[] {
  const elements: FlowGraphElement[] = [];

  nodes.forEach(node => {
    elements.push({
      data: {
        id: node,
        isSource: node === source,
        isSink: node === sink,
        isInPath: currentPath.includes(node),
      },
    });
  });

  edges.forEach(([u, v], index) => {
    const isInPath = currentPath.length > 1 && 
      currentPath.some((node, i) => 
        i < currentPath.length - 1 && 
        node === u && 
        currentPath[i + 1] === v
      );

    elements.push({
      data: {
        id: `${u}-${v}-${index}`,
        source: u,
        target: v,
        capacity: capacities[index],
        flow: flows[index],
        label: `${flows[index]}/${capacities[index]}`,
        isInPath: isInPath ? "true" : "false",
        isBackwardEdge: "false",
        saturated: flows[index] === capacities[index] ? "true" : "false",
        blocked: capacities[index] === 0 ? "true" : "false",
        pathFlow: isInPath ? capacities[index] - flows[index] : undefined,
      },
    });
  });

  return elements;
}