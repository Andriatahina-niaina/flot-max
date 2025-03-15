"use client";

import React, { useState } from "react";
import GraphInputForm from "../components/grapheInputForm";
import CytoscapeGraph from "../components/CytoscapeGraph";
import { calculateMaxFlow } from "../lib/fordFulkerson";
import { GraphData, FlowGraphElement } from "../../types/types";
import { Button } from "primereact/button";

const App: React.FC = () => {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [], capacities: [] });
  const [flowGraph, setFlowGraph] = useState<FlowGraphElement[]>([]);
  const [maxFlow, setMaxFlow] = useState<number>(0);
  const [residualGraph, setResidualGraph] = useState<number[][]>([]);
  const [error, setError] = useState<string | null>(null);

  const onGraphSubmit = (graphData: GraphData) => {
    if (!graphData.nodes || !graphData.edges || !graphData.capacities) {
      setError("Données du graphe invalides. Veuillez vérifier votre saisie.");
      return;
    }

    if (graphData.edges.length !== graphData.capacities.length) {
      setError("Le nombre d'arêtes et de capacités doit correspondre.");
      return;
    }

    setGraph(graphData);
    initializeFlowGraph(graphData);
    initializeResidualGraph(graphData);
    setError(null);
  };

  const initializeFlowGraph = (graphData: GraphData) => {
    const elements: FlowGraphElement[] = graphData.nodes.map((node) => ({
      data: { id: node },
    }));

    graphData.edges.forEach(([source, target], index) => {
      elements.push({
        data: {
          id: `${source}-${target}`,
          source: source,
          target: target,
          capacity: graphData.capacities[index],
        },
      });
    });

    setFlowGraph(elements);
  };

  const initializeResidualGraph = (graphData: GraphData) => {
    const size = graphData.nodes.length;
    const residual = Array.from({ length: size }, () => Array(size).fill(0));

    const nodeToIndex = new Map<string, number>();
    graphData.nodes.forEach((node, index) => {
      nodeToIndex.set(node, index);
    });

    graphData.edges.forEach(([u, v], index) => {
      const uIndex = nodeToIndex.get(u);
      const vIndex = nodeToIndex.get(v);
      const cap = graphData.capacities[index];

      if (uIndex === undefined || vIndex === undefined) {
        console.error(`Arête invalide : ${u} -> ${v}. Les nœuds ${u} ou ${v} n'existent pas.`);
        return;
      }

      residual[uIndex][vIndex] = cap;
    });

    setResidualGraph(residual);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-center">Algorithme de Ford-Fulkerson</h1>
      <GraphInputForm onGraphSubmit={onGraphSubmit} />
      {error && <p className="text-red-500">{error}</p>}
      <CytoscapeGraph elements={flowGraph} />
      <Button 
        label="Calculer le flot maximum" 
        onClick={() => {
          const result = calculateMaxFlow(graph.nodes, graph.edges);
          setMaxFlow(result);
        }} 
        className="w-full" 
      />

      {maxFlow > 0 && (
        <p className="text-lg font-semibold text-center mt-4">
          Flot maximum : <span className="text-blue-600">{maxFlow}</span>
        </p>
      )}
    </div>
  );
};

export default App;