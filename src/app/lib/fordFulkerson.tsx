import { FlowGraphElement } from "@/types/types";

export const calculateMaxFlow = (
  nodes: string[],
  edges: [string, string][],
  capacities: number[],
  source: string,
  sink: string
) => {
  const size = nodes.length;
  const residualGraph: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const nodeToIndex = new Map<string, number>();

  nodes.forEach((node, index) => nodeToIndex.set(node, index));

  edges.forEach(([u, v], index) => {
    const uIndex = nodeToIndex.get(u)!;
    const vIndex = nodeToIndex.get(v)!;
    residualGraph[uIndex][vIndex] = capacities[index];
  });

  const bfs = (parent: number[]): boolean => {
    const visited = new Array(size).fill(false);
    const queue: number[] = [];
    const srcIndex = nodeToIndex.get(source)!;
    const sinkIndex = nodeToIndex.get(sink)!;
    queue.push(srcIndex);
    visited[srcIndex] = true;
    parent[srcIndex] = -1;

    while (queue.length > 0) {
      const u = queue.shift()!;
      for (let v = 0; v < size; v++) {
        if (!visited[v] && residualGraph[u][v] > 0) {
          queue.push(v);
          parent[v] = u;
          visited[v] = true;
          if (v === sinkIndex) return true;
        }
      }
    }
    return false;
  };

  let maxFlow = 0;
  const parent = new Array(size).fill(-1);
  const steps: { elements: FlowGraphElement[] }[] = [];

  while (bfs(parent)) {
    let pathFlow = Infinity;
    let v = nodeToIndex.get(sink)!;

    while (v !== nodeToIndex.get(source)!) {
      const u = parent[v];
      pathFlow = Math.min(pathFlow, residualGraph[u][v]);
      v = u;
    }

    v = nodeToIndex.get(sink)!;
    while (v !== nodeToIndex.get(source)!) {
      const u = parent[v];
      residualGraph[u][v] -= pathFlow;
      residualGraph[v][u] += pathFlow;
      v = u;
    }

    maxFlow += pathFlow;

    // Générer les éléments pour cette étape
    const stepElements: FlowGraphElement[] = [
      // Ajouter les nœuds
      ...nodes.map((node) => ({ data: { id: node } })),
      // Ajouter les arêtes avec leur capacité et leur flux actuel
      ...edges.map(([u, v], index) => ({
        data: {
          id: `${u}-${v}`,
          source: u,
          target: v,
          capacity: capacities[index],
          flow: capacities[index] - residualGraph[nodeToIndex.get(u)!][nodeToIndex.get(v)!],
        },
      })),
    ];

    steps.push({ elements: stepElements });
  }

  const finalGraph = steps.length > 0 ? steps[steps.length - 1].elements : [];

  return { maxFlow, steps, finalGraph };
};