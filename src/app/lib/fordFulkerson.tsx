import { FlowGraphElement } from "@/types/types";

export const calculateMaxFlow = (
  nodes: string[],
  edges: [string, string][],
  initialCapacities: number[],
  source: string,
  sink: string
) => {
  const size = nodes.length;
  const flowGraph: number[][] = Array.from({ length: size }, () => Array(size).fill(0)); // Flots init à 0
  const residualGraph: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  // Nouvelle matrice pour suivre les capacités évolutives
  const currentCapacities: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const nodeToIndex = new Map<string, number>();

  // Initialisation des indices
  nodes.forEach((node, index) => nodeToIndex.set(node, index));

  // Initialisation du graphe résiduel et des capacités avec les valeurs originales
  edges.forEach(([u, v], index) => {
    const uIndex = nodeToIndex.get(u)!;
    const vIndex = nodeToIndex.get(v)!;
    residualGraph[uIndex][vIndex] = initialCapacities[index];
    currentCapacities[uIndex][vIndex] = initialCapacities[index]; // Capacités évolutives
  });

  // Fonction BFS pour trouver un chemin augmentant
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
          parent[v] = u;
          visited[v] = true;
          if (v === sinkIndex) return true;
          queue.push(v);
        }
      }
    }
    return false;
  };

  // Génération des éléments avec flots et capacités actuels
  const generateFlowElements = (
    currentPath: number[] = [],
    pathFlow: number = 0
  ): FlowGraphElement[] => {
    const elements: FlowGraphElement[] = [];

    // Ajout des nœuds
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

    // Ajout des arêtes avec flots/capacités évolutives
    edges.forEach(([u, v], edgeIndex) => {
      const uIndex = nodeToIndex.get(u)!;
      const vIndex = nodeToIndex.get(v)!;
      const capacity = currentCapacities[uIndex][vIndex]; // Capacité évolutive
      const flow = flowGraph[uIndex][vIndex];

      const isInPath = currentPath.length > 1 && 
        currentPath.some((node, idx) => 
          idx > 0 && currentPath[idx-1] === uIndex && node === vIndex
        );

      elements.push({
        data: {
          id: `${u}-${v}-${edgeIndex}`,
          source: u,
          target: v,
          capacity: capacity, // Capacité qui évolue
          flow: flow,        // Flot qui évolue
          label: `${flow}/${capacity}`,
          isInPath: isInPath,
          pathFlow: isInPath ? pathFlow : undefined,
        },
      });
    });

    return elements;
  };

  let maxFlow = 0;
  const parent = new Array(size).fill(-1);
  const steps: { 
    elements: FlowGraphElement[]; 
    pathFlow: number; 
    path: string[];
    description: string;
  }[] = [];

  // ÉTAPE 0 : État initial (flots à 0, capacités initiales)
  steps.push({
    elements: generateFlowElements(),
    pathFlow: 0,
    path: [],
    description: "État initial : flots = 0, capacités originales"
  });

  let iterationCount = 0;
  const MAX_ITERATIONS = 100; // Sécurité

  // Algorithme principal
  while (bfs(parent) && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    
    // 1. Trouver le flux maximal possible sur le chemin
    let pathFlow = Infinity;
    let v = nodeToIndex.get(sink)!;
    const currentPath: number[] = [];

    while (v !== nodeToIndex.get(source)!) {
      const u = parent[v];
      currentPath.unshift(v);
      pathFlow = Math.min(pathFlow, residualGraph[u][v]);
      v = u;
    }
    currentPath.unshift(nodeToIndex.get(source)!);

    const pathNames = currentPath.map(idx => nodes[idx]);

    // ÉTAPE INTERMÉDIAIRE : Montrer le chemin trouvé
    steps.push({
      elements: generateFlowElements(currentPath, pathFlow),
      pathFlow: pathFlow,
      path: pathNames,
      description: `Itération ${iterationCount} : Chemin trouvé avec flux ${pathFlow}`
    });

    // 2. Mettre à jour les flots ET les capacités
    v = nodeToIndex.get(sink)!;
    while (v !== nodeToIndex.get(source)!) {
      const u = parent[v];
      
      // Mise à jour des flots
      flowGraph[u][v] += pathFlow; // Augmente le flot direct
      flowGraph[v][u] -= pathFlow; // Diminue le flot inverse
      
      // Mise à jour du graphe résiduel
      residualGraph[u][v] -= pathFlow; 
      residualGraph[v][u] += pathFlow;
      
      // NOUVELLE LOGIQUE : Mise à jour des capacités évolutives
      // La capacité diminue du flux utilisé
      currentCapacities[u][v] -= pathFlow;
      // On peut aussi augmenter la capacité inverse si besoin
      if (currentCapacities[v][u] === 0) {
        currentCapacities[v][u] = pathFlow; // Création d'une capacité de retour
      } else {
        currentCapacities[v][u] += pathFlow;
      }
      
      v = u;
    }

    maxFlow += pathFlow;

    // ÉTAPE FINALE : Montrer l'état après mise à jour
    steps.push({
      elements: generateFlowElements([], 0),
      pathFlow: pathFlow,
      path: pathNames,
      description: `Après itération ${iterationCount} : Flots et capacités mis à jour`
    });
  }

  return {
    maxFlow,
    steps,
    finalGraph: generateFlowElements(),
    iterations: iterationCount
  };
};