"use client";

import React, { useState } from "react";
import GraphInputForm from "../components/grapheInputForm";
import CytoscapeGraph from "../components/CytoscapeGraph";
import { calculateMaxFlow } from "../lib/fordFulkerson";
import { GraphData, FlowGraphElement } from "../../types/types";
import { Button } from "primereact/button";

const App: React.FC = () => {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [], capacities: [],source:"",sink:"" });
  const [flowGraph, setFlowGraph] = useState<FlowGraphElement[]>([]);
  const [maxFlow, setMaxFlow] = useState<number>(0);
  const [evolutionSteps, setEvolutionSteps] = useState<FlowGraphElement[][]>([]);
  const [finalFlowGraph, setFinalFlowGraph] = useState<FlowGraphElement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onGraphSubmit = (graphData: GraphData) => {
    if (!graphData.nodes || !graphData.edges || !graphData.capacities) {
      setError("Données du graphe invalides.");
      return;
    }
  
    const nodeSet = new Set(graphData.nodes);
    for (const [source, target] of graphData.edges) {
      if (!nodeSet.has(source) || !nodeSet.has(target)) {
        setError(`Erreur : Le nœud "${source}" ou "${target}" est manquant.`);
        return;
      }
    }
  
    setGraph(graphData);
    initializeFlowGraph(graphData);
    setError(null);
  };
  

  const initializeFlowGraph = (graphData: GraphData) => {
    const elements: FlowGraphElement[] = [];
  
    // Ajouter les nœuds en premier
    graphData.nodes.forEach((node) => {
      elements.push({ data: { id: node } });
    });
  
    // Ajouter ensuite les arêtes
    graphData.edges.forEach(([source, target], index) => {
      if (!graphData.nodes.includes(source) || !graphData.nodes.includes(target)) {
        console.error(`Erreur : Le nœud source (${source}) ou cible (${target}) est introuvable.`);
        return; // Ignore cette arête incorrecte
      }
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
  

  const handleCalculateMaxFlow = () => {
    if (!graph.source || !graph.sink) {
      setError("Veuillez spécifier une source et un puits.");
      return;
    }
  
    const { maxFlow, steps, finalGraph } = calculateMaxFlow(
      graph.nodes,
      graph.edges,
      graph.capacities,
      graph.source,
      graph.sink
    );
  
    setMaxFlow(maxFlow);
    setEvolutionSteps(steps.map((step: { elements: any; }) => step.elements));
    setFinalFlowGraph(finalGraph);
  };
  

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-center">Algorithme de Ford-Fulkerson</h1>
      <GraphInputForm onGraphSubmit={onGraphSubmit} />
      {error && <p className="text-red-500">{error}</p>}
      
      <h2 className="text-lg font-semibold text-center">Graphe Initial</h2>
      {flowGraph.length > 0 && <CytoscapeGraph elements={flowGraph} />}
      
      <Button label="Calculer le flot maximum" onClick={handleCalculateMaxFlow} className="w-full" />
      
      {evolutionSteps.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-center">Évolution du Flot</h2>
          {evolutionSteps.map((step, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-center">Étape {index + 1}</h3>
              <CytoscapeGraph elements={step} />
            </div>
          ))}
        </>
      )}
      
      {finalFlowGraph.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-center">Graphe Final</h2>
          <CytoscapeGraph elements={finalFlowGraph} />
        </>
      )}
      
      {maxFlow > 0 && (
        <p className="text-lg font-semibold text-center mt-4">
          Flot maximum : <span className="text-blue-600">{maxFlow}</span>
        </p>
      )}
    </div>
  );
};

export default App;
