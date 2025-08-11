import { FlowGraphElement } from "@/types/types";

export const calculateMaxFlow = (
  nodes: string[],
  edges: [string, string][],
  initialCapacities: number[],
  source: string,
  sink: string
) => {
  const size = nodes.length;
  const flowGraph: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const residualGraph: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const nodeToIndex = new Map<string, number>();
  nodes.forEach((node, index) => nodeToIndex.set(node, index));

  // Initialisation du graphe résiduel
  edges.forEach(([u, v], index) => {
    const uIndex = nodeToIndex.get(u)!;
    const vIndex = nodeToIndex.get(v)!;
    residualGraph[uIndex][vIndex] = initialCapacities[index];
  });

  // Fonction pour générer les éléments du graphe avec état actuel
  const generateFlowElements = (
    currentPath: number[] = [],
    pathFlow: number = 0
  ): FlowGraphElement[] => {
    const elements: FlowGraphElement[] = [];

    // Ajouter les nœuds
    nodes.forEach((node, index) => {
      elements.push({
        data: {
          id: node,
          isSource: node === source,
          isSink: node === sink,
          isInPath: currentPath.includes(index),
        },
      });
    });

    // Ajouter les arêtes avec état actuel
    edges.forEach(([u, v], edgeIndex) => {
      const uIndex = nodeToIndex.get(u)!;
      const vIndex = nodeToIndex.get(v)!;
      const capacity = residualGraph[uIndex][vIndex] + flowGraph[vIndex][uIndex];
      const flow = flowGraph[uIndex][vIndex];
      const residual = residualGraph[uIndex][vIndex];

      // Vérifier si l'arête est dans le chemin actuel
      let isInPath = false;
      if (currentPath.length > 1) {
        for (let i = 0; i < currentPath.length - 1; i++) {
          if (currentPath[i] === uIndex && currentPath[i+1] === vIndex) {
            isInPath = true;
            break;
          }
        }
      }

      // Vérifier si c'est une arête de retour (flot inverse)
      const isBackwardEdge = flowGraph[vIndex][uIndex] > 0;

      elements.push({
        data: {
          id: `${u}-${v}-${edgeIndex}`,
          source: u,
          target: v,
          capacity: capacity,
          flow: flow,
          label: `${flow}/${capacity}`,
          isInPath: isInPath ? "true" : "false",
          isBackwardEdge: isBackwardEdge ? "true" : "false",
          saturated: (flow === capacity) ? "true" : "false",
          blocked: (capacity === 0) ? "true" : "false",
          pathFlow: isInPath ? pathFlow : undefined,
        },
      });
    });

    return elements;
  };

  let maxFlow = 0;
  const parent = new Array(size).fill(-1);
  const steps: any[] = [];

  // État initial
  steps.push({
    elements: generateFlowElements(),
    pathFlow: 0,
    path: [],
    description: "État initial : Aucun flot n'a encore été envoyé",
    flows: new Array(edges.length).fill(0),
  });

  let iterationCount = 0;
  const MAX_ITERATIONS = 100;

  while (true) {
    iterationCount++;
    if (iterationCount > MAX_ITERATIONS) break;

    // Trouver un chemin augmentant avec BFS
    const visited = new Array(size).fill(false);
    const queue: number[] = [];
    const srcIndex = nodeToIndex.get(source)!;
    const sinkIndex = nodeToIndex.get(sink)!;

    queue.push(srcIndex);
    visited[srcIndex] = true;
    parent.fill(-1);

    let foundPath = false;
    while (queue.length > 0 && !foundPath) {
      const u = queue.shift()!;
      for (let v = 0; v < size; v++) {
        if (!visited[v] && residualGraph[u][v] > 0) {
          parent[v] = u;
          visited[v] = true;
          if (v === sinkIndex) {
            foundPath = true;
            break;
          }
          queue.push(v);
        }
      }
    }

    if (!foundPath) break;

    // Calculer le flux maximal possible sur ce chemin
    let pathFlow = Infinity;
    let v = sinkIndex;
    const currentPath: number[] = [v];

    while (v !== srcIndex) {
      const u = parent[v];
      pathFlow = Math.min(pathFlow, residualGraph[u][v]);
      v = u;
      currentPath.unshift(v);
    }

    const pathNames = currentPath.map(idx => nodes[idx]);

    // Étape 1: Chemin trouvé
    steps.push({
      elements: generateFlowElements(currentPath, pathFlow),
      pathFlow: pathFlow,
      path: pathNames,
      description: `Étape ${iterationCount}.1 : Chemin augmentant trouvé (${pathNames.join(" → ")}) avec un flux possible de ${pathFlow}`,
      flows: edges.map(([u, v], i) => {
        const uIdx = nodeToIndex.get(u)!;
        const vIdx = nodeToIndex.get(v)!;
        return flowGraph[uIdx][vIdx];
      }),
    });

    // Mettre à jour les flots et le graphe résiduel
    v = sinkIndex;
    while (v !== srcIndex) {
      const u = parent[v];
      
      // Mise à jour du flot direct
      flowGraph[u][v] += pathFlow;
      // Mise à jour du flot inverse
      flowGraph[v][u] -= pathFlow;
      
      // Mise à jour du graphe résiduel
      residualGraph[u][v] -= pathFlow;
      residualGraph[v][u] += pathFlow;
      
      v = u;
    }

    maxFlow += pathFlow;

    // Étape 2: Après mise à jour des flots
    steps.push({
      elements: generateFlowElements([], 0),
      pathFlow: pathFlow,
      path: pathNames,
      description: `Étape ${iterationCount}.2 : Flots mis à jour - Nouveau flot total = ${maxFlow}`,
      flows: edges.map(([u, v], i) => {
        const uIdx = nodeToIndex.get(u)!;
        const vIdx = nodeToIndex.get(v)!;
        return flowGraph[uIdx][vIdx];
      }),
    });
  }

  // État final
  steps.push({
    elements: generateFlowElements(),
    pathFlow: maxFlow,
    path: [],
    description: `État final : Flot maximum de ${maxFlow} atteint après ${iterationCount-1} itérations`,
    flows: edges.map(([u, v], i) => {
      const uIdx = nodeToIndex.get(u)!;
      const vIdx = nodeToIndex.get(v)!;
      return flowGraph[uIdx][vIdx];
    }),
  });

  return {
    maxFlow,
    steps,
    finalGraph: generateFlowElements(),
    iterations: iterationCount - 1,
  };
};