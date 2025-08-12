import React, { useState, useEffect } from "react";

type Edge = [string, string];

interface GraphData {
  nodes: string[];
  edges: Edge[];
  capacities: number[];
  source: string;
  sink: string;
}

interface FlowStep {
  flows: number[];
  pathFlow: number;
  path: string[];
  description: string;
  residualMatrix: { [key: string]: { [key: string]: number } };
}

interface GraphInputFormProps {
  onGraphSubmit?: (graph: GraphData) => void;
  evolutionSteps?: FlowStep[];
  currentStep?: number;
  maxFlow?: number;
}

const GraphInputForm: React.FC<GraphInputFormProps> = ({ 
  onGraphSubmit,
  evolutionSteps = [],
  currentStep = 0,
  maxFlow = 0
}) => {
  const [source, setSource] = useState<string>("X");
  const [sink, setSink] = useState<string>("Y");
  const [nodes, setNodes] = useState<string>("X,A,B,C,D,E,F,G,Y");
  const [edges, setEdges] = useState<string>("X,A;X,B;X,C;A,D;A,E;A,G;B,D;B,E;B,F;C,F;C,G;D,Y;E,Y;F,Y;G,Y");
  const [capacities, setCapacities] = useState<string>("45,25,30,10,15,20,20,5,15,10,15,30,10,20,40");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<{from: string, to: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    handleSubmit();
  }, []);

  const handleSubmit = () => {
    try {
      const nodeList = nodes.split(",").map(n => n.trim());
      const edgeList = edges.split(";").map((edge) => {
        const [src, dest] = edge.split(",").map(e => e.trim());
        return [src, dest] as Edge;
      });
      const capacityList = capacities.split(",").map(c => Number(c.trim()));

      const nodeSet = new Set(nodeList);
      for (const [source, target] of edgeList) {
        if (!nodeSet.has(source) || !nodeSet.has(target)) {
          setError(`Erreur : Le nœud "${source}" ou "${target}" est manquant.`);
          return;
        }
      }

      if (capacityList.some((capacity) => isNaN(capacity) || capacity < 0)) {
        setError("Toutes les capacités doivent être des nombres positifs ou nuls.");
        return;
      }

      if (edgeList.length !== capacityList.length) {
        setError("Le nombre d'arêtes doit correspondre au nombre de capacités.");
        return;
      }

      const graph: GraphData = {
        nodes: nodeList,
        edges: edgeList,
        capacities: capacityList,
        source: source.trim(),
        sink: sink.trim(),
      };

      setGraphData(graph);
      onGraphSubmit?.(graph);
      setError(null);
    } catch (e) {
      setError("Une erreur est survenue lors de la validation des données.");
    }
  };

  const getCurrentResidualMatrix = () => {
    if (!graphData) return null;

    let currentFlows: number[];
    if (evolutionSteps.length > 0 && currentStep < evolutionSteps.length) {
      currentFlows = evolutionSteps[currentStep].flows;
    } else {
      currentFlows = new Array(graphData.edges.length).fill(0);
    }

    const matrix: { [key: string]: { [key: string]: number } } = {};
    
    graphData.nodes.forEach(node1 => {
      matrix[node1] = {};
      graphData.nodes.forEach(node2 => {
        if (node1 !== node2) {
          matrix[node1][node2] = 0;
        }
      });
    });

    graphData.edges.forEach((edge, index) => {
      const [from, to] = edge;
      const capacity = graphData.capacities[index];
      const flow = currentFlows[index] || 0;
      const residual = capacity - flow;

      matrix[from][to] = Math.max(0, residual);

      if (flow > 0) {
        matrix[to][from] = flow;
      }
    });

    return matrix;
  };

  const residualMatrix = getCurrentResidualMatrix();

  const getCellStyle = (value: number, from: string, to: string) => {
    const isEditing = editingCell?.from === from && editingCell?.to === to;
    
    if (isEditing) {
      return { backgroundColor: '#fff3cd', border: '2px solid #856404' };
    }
    
    if (value === 0) {
      return { backgroundColor: '#f8d7da', color: '#721c24' };
    }
    if (value > 0 && value <= 10) {
      return { backgroundColor: '#fff3cd', color: '#856404' };
    }
    return { backgroundColor: '#d4edda', color: '#155724' };
  };

  const handleCellClick = (from: string, to: string, value: number) => {
    if (from === to) return;
    
    setEditingCell({ from, to });
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (!editingCell || !graphData) return;

    const newValue = parseInt(editValue);
    if (isNaN(newValue) || newValue < 0) {
      setError("La valeur doit être un nombre positif ou nul.");
      return;
    }

    const edgeIndex = graphData.edges.findIndex(
      ([from, to]) => from === editingCell.from && to === editingCell.to
    );

    if (edgeIndex !== -1) {
      const newCapacities = [...graphData.capacities];
      newCapacities[edgeIndex] = newValue;
      
      const newGraph = { ...graphData, capacities: newCapacities };
      setGraphData(newGraph);
      onGraphSubmit?.(newGraph);
      setCapacities(newCapacities.join(","));
    } else {
      const newEdges = [...graphData.edges, [editingCell.from, editingCell.to] as Edge];
      const newCapacities = [...graphData.capacities, newValue];
      
      const newGraph = {
        ...graphData,
        edges: newEdges,
        capacities: newCapacities
      };
      
      setGraphData(newGraph);
      onGraphSubmit?.(newGraph);
      setEdges(newEdges.map(([from, to]) => `${from},${to}`).join(";"));
      setCapacities(newCapacities.join(","));
    }

    setEditingCell(null);
    setEditValue("");
    setIsEditing(false);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
    setIsEditing(false);
  };

  const getCurrentStepInfo = () => {
    if (evolutionSteps.length === 0 || currentStep >= evolutionSteps.length) {
      return { description: "État initial - Aucun flot", pathFlow: 0, path: [] };
    }
    
    const step = evolutionSteps[currentStep];
    return {
      description: step.description || `Étape ${currentStep + 1}`,
      pathFlow: step.pathFlow || 0,
      path: step.path || []
    };
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Algorithme de Flot Maximal avec Capacité Minimale
        </h2>
        
        {evolutionSteps.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-blue-800">
                  {stepInfo.description}
                </h4>
                {stepInfo.pathFlow > 0 && (
                  <p className="text-blue-700">
                    Chemin sélectionné: {stepInfo.path.join(" → ")} (Capacité minimale: {stepInfo.pathFlow})
                  </p>
                )}
              </div>
              {maxFlow > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    Flot Cumulé: {maxFlow}
                  </div>
                  <div className="text-sm text-blue-500">
                    Étape {currentStep + 1} / {evolutionSteps.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Configuration du Graphe</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source :
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puits :
                  </label>
                  <input
                    type="text"
                    value={sink}
                    onChange={(e) => setSink(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nœuds :
                </label>
                <textarea
                  value={nodes}
                  onChange={(e) => setNodes(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arêtes :
                </label>
                <textarea
                  value={edges}
                  onChange={(e) => setEdges(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacités :
                </label>
                <textarea
                  value={capacities}
                  onChange={(e) => setCapacities(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Actualiser le Graphe
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
          </div>

          {graphData && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">État des Arêtes</h3>
              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full text-sm border border-gray-300">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">Arc</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Cap.</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Flot</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Rés.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphData.edges.map((edge, index) => {
                      const currentFlow = evolutionSteps.length > 0 && currentStep < evolutionSteps.length 
                        ? evolutionSteps[currentStep].flows[index] || 0 
                        : 0;
                      const residual = graphData.capacities[index] - currentFlow;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">
                            {edge[0]}→{edge[1]}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            {graphData.capacities[index]}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-medium text-blue-600">
                            {currentFlow}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-medium"
                              style={{ color: residual === 0 ? '#dc3545' : '#28a745' }}>
                            {residual}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Légende</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-200 border border-green-400 mr-3 rounded"></div>
                <span>Capacité résiduelle disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-200 border border-yellow-400 mr-3 rounded"></div>
                <span>Capacité résiduelle faible</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-200 border border-red-400 mr-3 rounded"></div>
                <span>Arc bloqué (capacité 0)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-600 mr-3 rounded"></div>
                <span>Cellule en édition</span>
              </div>
            </div>
          </div>
        </div>

        {residualMatrix && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Matrice des Capacités Résiduelles
              </h3>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20 p-1 border border-gray-300 rounded text-sm"
                    min="0"
                    autoFocus
                  />
                  <button
                    onClick={handleEditSubmit}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    ✗
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-auto">
              <table className="border-collapse border border-gray-400 mx-auto">
                <thead>
                  <tr>
                    <th className="border border-gray-400 px-3 py-2 bg-gray-100 font-bold w-12 h-12"></th>
                    {graphData!.nodes.map(node => (
                      <th key={node} className="border border-gray-400 px-3 py-2 bg-gray-100 font-bold w-12 h-12">
                        {node}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graphData!.nodes.map(fromNode => (
                    <tr key={fromNode}>
                      <td className="border border-gray-400 px-3 py-2 bg-gray-100 font-bold w-12 h-12">
                        {fromNode}
                      </td>
                      {graphData!.nodes.map(toNode => (
                        <td
                          key={toNode}
                          className="border border-gray-400 px-3 py-2 text-center w-12 h-12 cursor-pointer transition-colors hover:bg-gray-100"
                          style={fromNode === toNode ? 
                            { backgroundColor: '#f0f0f0', cursor: 'default' } : 
                            getCellStyle(residualMatrix[fromNode][toNode], fromNode, toNode)
                          }
                          onClick={() => fromNode !== toNode && handleCellClick(fromNode, toNode, residualMatrix[fromNode][toNode])}
                        >
                          {fromNode === toNode ? 
                            '' : 
                            residualMatrix[fromNode][toNode]
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {evolutionSteps.length > 0 && (
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p><strong>Évolution détectée :</strong></p>
                <p>La matrice montre les capacités résiduelles après chaque étape de l'algorithme.</p>
                <p>Les valeurs sont mises à jour en soustrayant la capacité minimale du chemin sélectionné.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphInputForm;